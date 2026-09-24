import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryBiDashboardDto } from './dto/bi-dashboard.dto';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTH_SHORT_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'
];

const CRITICAL_INCIDENCIA_IDS = [66, 1, 94]; // Cruce apagado, Problema cruce, Siniestro

@Injectable()
export class BiDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhereClause(query: QueryBiDashboardDto) {
    const { anho, mes, distrito, administradorId, equipoId, prioridadId, caracteristica } = query;
    const where: any = {};

    // Año y Mes
    const targetYear = anho ? Number(anho) : new Date().getFullYear();
    
    if (mes) {
      const monthValue = Number(mes);
      const nextMonth = monthValue === 12 ? 1 : monthValue + 1;
      const nextYear = monthValue === 12 ? targetYear + 1 : targetYear;
      
      const yearMonth = `${targetYear}-${String(monthValue).padStart(2, '0')}`;
      const nextYearMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
      
      where.createdAt = {
        gte: new Date(`${yearMonth}-01T00:00:00.000Z`),
        lt: new Date(`${nextYearMonth}-01T00:00:00.000Z`),
      };
    } else {
      where.createdAt = {
        gte: new Date(`${targetYear}-01-01T00:00:00.000Z`),
        lt: new Date(`${targetYear + 1}-01-01T00:00:00.000Z`),
      };
    }

    if (equipoId) {
      where.equipoId = Number(equipoId);
    }

    if (prioridadId) {
      where.OR = [
        { prioridadId: Number(prioridadId) },
        { incidencia: { prioridadId: Number(prioridadId) } },
      ];
    }

    if (caracteristica) {
      where.incidencia = {
        ...where.incidencia,
        caracteristica: caracteristica,
      };
    }

    // Filtros por cruce (administrador o distrito)
    if (administradorId || distrito) {
      where.cruce = {};
      if (administradorId) {
        where.cruce.administradorId = Number(administradorId);
      }
      if (distrito) {
        where.cruce.ubigeo = {
          distrito: {
            contains: distrito,
            mode: 'insensitive',
          },
        };
      }
    }

    return { where, targetYear };
  }

  async getAvailableFilterOptions() {
    const [yearsResult, administradores, equipos, distritosResult] = await Promise.all([
      this.prisma.$queryRawUnsafe<Array<{ anho: number }>>(`
        SELECT DISTINCT EXTRACT(YEAR FROM created)::integer AS anho
        FROM tickets
        WHERE created IS NOT NULL
        ORDER BY anho DESC
      `),
      this.prisma.administrador.findMany({
        where: { estado: true },
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.equipo.findMany({
        where: { estado: true },
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.$queryRawUnsafe<Array<{ distrito: string }>>(`
        SELECT DISTINCT u.distrito
        FROM cruces c
        JOIN ubigeos u ON c.ubigeo_id = u.id
        WHERE u.distrito IS NOT NULL AND u.distrito != ''
        ORDER BY u.distrito ASC
      `),
    ]);

    const currentYear = new Date().getFullYear();
    const availableYears = yearsResult.map(y => y.anho).filter(Boolean);
    if (!availableYears.includes(currentYear)) {
      availableYears.unshift(currentYear);
    }

    return {
      years: availableYears,
      months: MONTH_NAMES.map((name, index) => ({ id: index + 1, name, shortName: MONTH_SHORT_NAMES[index] })),
      administradores,
      equipos,
      distritos: distritosResult.map(d => d.distrito),
    };
  }

  async getExecutiveKpis(query: QueryBiDashboardDto) {
    const { where } = this.buildWhereClause(query);

    // Consulta de agregaciones principales
    const [
      total,
      resueltos,
      pendientes,
      enProceso,
      criticas,
      distinctCrucesAfectados,
      distinctCrucesAtendidos,
      timeStats,
    ] = await Promise.all([
      // Total tickets
      this.prisma.ticket.count({ where }),
      // Resueltos (estadoId = 4)
      this.prisma.ticket.count({ where: { ...where, estadoId: 4 } }),
      // Pendientes / Asignados (estadoId = 1)
      this.prisma.ticket.count({ where: { ...where, estadoId: 1 } }),
      // En Proceso (estadoId = 2 o 5)
      this.prisma.ticket.count({ where: { ...where, estadoId: { in: [2, 5] } } }),
      // Críticas
      this.prisma.ticket.count({
        where: {
          ...where,
          OR: [
            { prioridadId: 1 },
            { incidenciaId: { in: CRITICAL_INCIDENCIA_IDS } },
            { incidencia: { prioridadId: 1 } },
          ],
        },
      }),
      // Intersecciones distintas afectadas
      this.prisma.ticket.groupBy({
        by: ['cruceId'],
        where: { ...where, cruceId: { not: null } },
      }),
      // Intersecciones distintas atendidas/resueltas
      this.prisma.ticket.groupBy({
        by: ['cruceId'],
        where: { ...where, cruceId: { not: null }, estadoId: 4 },
      }),
      // Promedio de tiempo de resolución (horas)
      this.prisma.$queryRawUnsafe<Array<{ avg_hours: number | null }>>(`
        SELECT AVG(EXTRACT(EPOCH FROM (t.modified - t.created)) / 3600.0) AS avg_hours
        FROM tickets t
        LEFT JOIN incidencias i ON t.incidencia_id = i.id
        LEFT JOIN cruces c ON t.cruce_id = c.id
        LEFT JOIN ubigeos u ON c.ubigeo_id = u.id
        WHERE t.estado_id = 4
          AND t.created IS NOT NULL 
          AND t.modified IS NOT NULL
          AND t.modified >= t.created
          ${where.createdAt?.gte ? `AND t.created >= '${where.createdAt.gte.toISOString()}'` : ''}
          ${where.createdAt?.lt ? `AND t.created < '${where.createdAt.lt.toISOString()}'` : ''}
          ${query.caracteristica ? `AND i.caracteristica = '${query.caracteristica}'` : ''}
          ${where.equipoId ? `AND t.equipo_id = ${where.equipoId}` : ''}
          ${query.administradorId ? `AND c.administrador_id = ${Number(query.administradorId)}` : ''}
          ${query.distrito ? `AND u.distrito ILIKE '%${query.distrito}%'` : ''}
      `),
    ]);

    const tasaResolucion = total > 0 ? Math.round((resueltos / total) * 1000) / 10 : 0;
    const tiempoPromedioHoras = timeStats[0]?.avg_hours ? Math.round(Number(timeStats[0].avg_hours) * 10) / 10 : 0;
    const tiempoPromedioDias = Math.round((tiempoPromedioHoras / 24) * 10) / 10;

    return {
      totalIncidencias: total,
      incidenciasAtendidas: resueltos,
      incidenciasPendientes: pendientes,
      incidenciasEnProceso: enProceso,
      tasaResolucion,
      interseccionesAfectadas: distinctCrucesAfectados.length,
      interseccionesAtendidas: distinctCrucesAtendidos.length,
      tiempoPromedioHoras,
      tiempoPromedioDias,
      incidenciasCriticas: criticas,
    };
  }

  async getTrend(query: QueryBiDashboardDto) {
    const targetYear = query.anho ? Number(query.anho) : new Date().getFullYear();
    const targetMonth = query.mes ? Number(query.mes) : undefined;

    if (targetMonth) {
      // Evolución Diaria cuando se selecciona un mes
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
      const monthStr = String(targetMonth).padStart(2, '0');
      const nextMonth = targetMonth === 12 ? 1 : targetMonth + 1;
      const nextYear = targetMonth === 12 ? targetYear + 1 : targetYear;
      const nextMonthStr = String(nextMonth).padStart(2, '0');

      const startDate = `${targetYear}-${monthStr}-01T00:00:00.000Z`;
      const endDate = `${nextYear}-${nextMonthStr}-01T00:00:00.000Z`;

      const stats = await this.prisma.$queryRawUnsafe<Array<{
        dia: number;
        total: number;
        incidencias: number;
        mantenimientos: number;
        resueltos: number;
        avg_hours: number | null;
      }>>(`
        SELECT 
          EXTRACT(DAY FROM t.created)::integer AS dia,
          COUNT(*)::integer AS total,
          COUNT(CASE WHEN i.caracteristica = 'I' OR i.caracteristica IS NULL THEN 1 END)::integer AS incidencias,
          COUNT(CASE WHEN i.caracteristica = 'T' THEN 1 END)::integer AS mantenimientos,
          COUNT(CASE WHEN t.estado_id = 4 THEN 1 END)::integer AS resueltos,
          AVG(CASE WHEN t.estado_id = 4 AND t.modified >= t.created THEN EXTRACT(EPOCH FROM (t.modified - t.created)) / 3600.0 END) AS avg_hours
        FROM tickets t
        LEFT JOIN incidencias i ON t.incidencia_id = i.id
        LEFT JOIN cruces c ON t.cruce_id = c.id
        LEFT JOIN ubigeos u ON c.ubigeo_id = u.id
        WHERE t.created >= '${startDate}'
          AND t.created < '${endDate}'
          ${query.caracteristica ? `AND i.caracteristica = '${query.caracteristica}'` : ''}
          ${query.equipoId ? `AND t.equipo_id = ${Number(query.equipoId)}` : ''}
          ${query.administradorId ? `AND c.administrador_id = ${Number(query.administradorId)}` : ''}
          ${query.distrito ? `AND u.distrito ILIKE '%${query.distrito}%'` : ''}
        GROUP BY EXTRACT(DAY FROM t.created)
        ORDER BY dia ASC
      `);

      const mesNombre = MONTH_NAMES[targetMonth - 1];

      const fullDays = Array.from({ length: daysInMonth }, (_, idx) => {
        const diaNum = idx + 1;
        const found = stats.find(s => s.dia === diaNum);
        const diaStr = String(diaNum).padStart(2, '0');
        return {
          periodo: diaNum,
          dia: diaNum,
          mes: targetMonth,
          mesNombre,
          mesCorto: MONTH_SHORT_NAMES[targetMonth - 1],
          etiqueta: diaStr,
          nombreCompleto: `${diaStr} de ${mesNombre}`,
          total: found ? Number(found.total) : 0,
          incidencias: found ? Number(found.incidencias) : 0,
          mantenimientos: found ? Number(found.mantenimientos) : 0,
          resueltos: found ? Number(found.resueltos) : 0,
          tiempoPromedioHoras: found && found.avg_hours ? Math.round(Number(found.avg_hours) * 10) / 10 : 0,
        };
      });

      return {
        trendType: 'diario' as const,
        trendLabel: `Evolución Diaria: ${mesNombre} ${targetYear}`,
        mes: targetMonth,
        mesNombre,
        anho: targetYear,
        data: fullDays,
      };
    } else {
      // Evolución Mensual cuando no hay mes seleccionado (todos los meses)
      const stats = await this.prisma.$queryRawUnsafe<Array<{
        mes: number;
        total: number;
        incidencias: number;
        mantenimientos: number;
        resueltos: number;
        avg_hours: number | null;
      }>>(`
        SELECT 
          EXTRACT(MONTH FROM t.created)::integer AS mes,
          COUNT(*)::integer AS total,
          COUNT(CASE WHEN i.caracteristica = 'I' OR i.caracteristica IS NULL THEN 1 END)::integer AS incidencias,
          COUNT(CASE WHEN i.caracteristica = 'T' THEN 1 END)::integer AS mantenimientos,
          COUNT(CASE WHEN t.estado_id = 4 THEN 1 END)::integer AS resueltos,
          AVG(CASE WHEN t.estado_id = 4 AND t.modified >= t.created THEN EXTRACT(EPOCH FROM (t.modified - t.created)) / 3600.0 END) AS avg_hours
        FROM tickets t
        LEFT JOIN incidencias i ON t.incidencia_id = i.id
        LEFT JOIN cruces c ON t.cruce_id = c.id
        LEFT JOIN ubigeos u ON c.ubigeo_id = u.id
        WHERE t.created >= '${targetYear}-01-01T00:00:00.000Z'
          AND t.created < '${targetYear + 1}-01-01T00:00:00.000Z'
          ${query.caracteristica ? `AND i.caracteristica = '${query.caracteristica}'` : ''}
          ${query.equipoId ? `AND t.equipo_id = ${Number(query.equipoId)}` : ''}
          ${query.administradorId ? `AND c.administrador_id = ${Number(query.administradorId)}` : ''}
          ${query.distrito ? `AND u.distrito ILIKE '%${query.distrito}%'` : ''}
        GROUP BY EXTRACT(MONTH FROM t.created)
        ORDER BY mes ASC
      `);

      const fullMonths = Array.from({ length: 12 }, (_, idx) => {
        const mesNum = idx + 1;
        const found = stats.find(s => s.mes === mesNum);
        return {
          periodo: mesNum,
          mes: mesNum,
          mesNombre: MONTH_NAMES[idx],
          mesCorto: MONTH_SHORT_NAMES[idx],
          etiqueta: MONTH_SHORT_NAMES[idx],
          nombreCompleto: MONTH_NAMES[idx],
          total: found ? Number(found.total) : 0,
          incidencias: found ? Number(found.incidencias) : 0,
          mantenimientos: found ? Number(found.mantenimientos) : 0,
          resueltos: found ? Number(found.resueltos) : 0,
          tiempoPromedioHoras: found && found.avg_hours ? Math.round(Number(found.avg_hours) * 10) / 10 : 0,
        };
      });

      return {
        trendType: 'mensual' as const,
        trendLabel: `Evolución Mensual: Año ${targetYear}`,
        anho: targetYear,
        data: fullMonths,
      };
    }
  }

  async getMonthlyTrend(query: QueryBiDashboardDto) {
    const result = await this.getTrend(query);
    return result.data;
  }

  async getCausesBreakdown(query: QueryBiDashboardDto) {
    const { where } = this.buildWhereClause(query);

    const causes = await this.prisma.ticket.groupBy({
      by: ['incidenciaId'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const totalInPeriod = await this.prisma.ticket.count({ where });

    // Obtener nombres de las incidencias
    const incidenciaIds = causes.map(c => c.incidenciaId);
    const incidenciasInfo = await this.prisma.incidencia.findMany({
      where: { id: { in: incidenciaIds } },
      select: {
        id: true,
        tipo: true,
        caracteristica: true,
        prioridadId: true,
        parentId: true,
      },
    });

    const infoMap = new Map(incidenciasInfo.map(i => [i.id, i]));

    return causes.map(c => {
      const info = infoMap.get(c.incidenciaId);
      const count = c._count.id;
      const porcentaje = totalInPeriod > 0 ? Math.round((count / totalInPeriod) * 1000) / 10 : 0;
      return {
        id: c.incidenciaId,
        nombre: info?.tipo || `Tipo #${c.incidenciaId}`,
        caracteristica: info?.caracteristica || 'I',
        prioridadId: info?.prioridadId || 3,
        esCritica: CRITICAL_INCIDENCIA_IDS.includes(c.incidenciaId) || info?.prioridadId === 1,
        total: count,
        porcentaje,
      };
    });
  }

  async getDistrictsAnalytics(query: QueryBiDashboardDto) {
    const { where, targetYear } = this.buildWhereClause(query);

    const districtData = await this.prisma.$queryRawUnsafe<Array<{
      distrito: string;
      total: number;
      cruces_count: number;
      resueltos: number;
    }>>(`
      SELECT 
        COALESCE(u.distrito, 'Sin Distrito') AS distrito,
        COUNT(t.id)::integer AS total,
        COUNT(DISTINCT t.cruce_id)::integer AS cruces_count,
        COUNT(CASE WHEN t.estado_id = 4 THEN 1 END)::integer AS resueltos
      FROM tickets t
      JOIN cruces c ON t.cruce_id = c.id
      LEFT JOIN ubigeos u ON c.ubigeo_id = u.id
      LEFT JOIN incidencias i ON t.incidencia_id = i.id
      WHERE t.created >= '${where.createdAt?.gte?.toISOString() || `${targetYear}-01-01T00:00:00.000Z`}'
        AND t.created < '${where.createdAt?.lt?.toISOString() || `${targetYear + 1}-01-01T00:00:00.000Z`}'
        ${query.caracteristica ? `AND i.caracteristica = '${query.caracteristica}'` : ''}
        ${query.administradorId ? `AND c.administrador_id = ${Number(query.administradorId)}` : ''}
        ${query.equipoId ? `AND t.equipo_id = ${Number(query.equipoId)}` : ''}
      GROUP BY u.distrito
      ORDER BY total DESC
      LIMIT 15
    `);

    const totalGeneral = districtData.reduce((acc, curr) => acc + Number(curr.total), 0);

    return districtData.map(d => ({
      distrito: d.distrito,
      total: Number(d.total),
      crucesAfectados: Number(d.cruces_count),
      resueltos: Number(d.resueltos),
      tasaResolucion: Number(d.total) > 0 ? Math.round((Number(d.resueltos) / Number(d.total)) * 1000) / 10 : 0,
      porcentajeTotal: totalGeneral > 0 ? Math.round((Number(d.total) / totalGeneral) * 1000) / 10 : 0,
    }));
  }

  async getTeamsWorkload(query: QueryBiDashboardDto) {
    const { where, targetYear } = this.buildWhereClause(query);

    const teamsData = await this.prisma.$queryRawUnsafe<Array<{
      equipo_id: number;
      equipo_nombre: string;
      total: number;
      resueltos: number;
      avg_hours: number | null;
    }>>(`
      SELECT 
        COALESCE(e.id, 0)::integer AS equipo_id,
        COALESCE(e.nombre, 'Sin Asignar') AS equipo_nombre,
        COUNT(t.id)::integer AS total,
        COUNT(CASE WHEN t.estado_id = 4 THEN 1 END)::integer AS resueltos,
        AVG(CASE WHEN t.estado_id = 4 AND t.modified >= t.created THEN EXTRACT(EPOCH FROM (t.modified - t.created)) / 3600.0 END) AS avg_hours
      FROM tickets t
      LEFT JOIN equipos e ON t.equipo_id = e.id
      LEFT JOIN cruces c ON t.cruce_id = c.id
      LEFT JOIN ubigeos u ON c.ubigeo_id = u.id
      LEFT JOIN incidencias i ON t.incidencia_id = i.id
      WHERE t.created >= '${where.createdAt?.gte?.toISOString() || `${targetYear}-01-01T00:00:00.000Z`}'
        AND t.created < '${where.createdAt?.lt?.toISOString() || `${targetYear + 1}-01-01T00:00:00.000Z`}'
        ${query.caracteristica ? `AND i.caracteristica = '${query.caracteristica}'` : ''}
        ${query.administradorId ? `AND c.administrador_id = ${Number(query.administradorId)}` : ''}
        ${query.distrito ? `AND u.distrito ILIKE '%${query.distrito}%'` : ''}
      GROUP BY e.id, e.nombre
      ORDER BY total DESC
    `);

    return teamsData.map(t => ({
      equipoId: Number(t.equipo_id),
      equipoNombre: t.equipo_nombre,
      total: Number(t.total),
      resueltos: Number(t.resueltos),
      tasaResolucion: Number(t.total) > 0 ? Math.round((Number(t.resueltos) / Number(t.total)) * 1000) / 10 : 0,
      tiempoPromedioHoras: t.avg_hours ? Math.round(Number(t.avg_hours) * 10) / 10 : 0,
    }));
  }

  async getStatusAndPriorityBreakdown(query: QueryBiDashboardDto) {
    const { where, targetYear } = this.buildWhereClause(query);

    const [byStatus, byPriority, byType] = await Promise.all([
      this.prisma.ticket.groupBy({
        by: ['estadoId'],
        where,
        _count: { id: true },
      }),
      this.prisma.ticket.groupBy({
        by: ['prioridadId'],
        where,
        _count: { id: true },
      }),
      this.prisma.$queryRawUnsafe<Array<{ caracteristica: string; total: number }>>(`
        SELECT 
          COALESCE(i.caracteristica, 'I') AS caracteristica,
          COUNT(t.id)::integer AS total
        FROM tickets t
        LEFT JOIN incidencias i ON t.incidencia_id = i.id
        LEFT JOIN cruces c ON t.cruce_id = c.id
        LEFT JOIN ubigeos u ON c.ubigeo_id = u.id
        WHERE t.created >= '${where.createdAt?.gte?.toISOString() || `${targetYear}-01-01T00:00:00.000Z`}'
          AND t.created < '${where.createdAt?.lt?.toISOString() || `${targetYear + 1}-01-01T00:00:00.000Z`}'
          ${where.equipoId ? `AND t.equipo_id = ${where.equipoId}` : ''}
          ${query.administradorId ? `AND c.administrador_id = ${Number(query.administradorId)}` : ''}
          ${query.distrito ? `AND u.distrito ILIKE '%${query.distrito}%'` : ''}
        GROUP BY i.caracteristica
      `),
    ]);

    const estadosCatalog = await this.prisma.estado.findMany({
      select: { id: true, nombre: true },
    });
    const estadosMap = new Map(estadosCatalog.map(e => [e.id, e.nombre]));

    return {
      porEstado: byStatus.map(s => ({
        estadoId: s.estadoId || 0,
        nombre: estadosMap.get(s.estadoId || 0) || 'Desconocido',
        total: s._count.id,
      })),
      porPrioridad: byPriority.map(p => {
        let nombre = 'Baja';
        if (p.prioridadId === 1) nombre = 'Alta';
        else if (p.prioridadId === 2) nombre = 'Media';
        return {
          prioridadId: p.prioridadId || 3,
          nombre,
          total: p._count.id,
        };
      }),
      porTipoTrabajo: byType.map(t => ({
        tipo: t.caracteristica === 'T' ? 'Trabajo / Mantenimiento' : 'Incidencia de Tránsito',
        caracteristica: t.caracteristica,
        total: Number(t.total),
      })),
    };
  }

  async getFullDashboardData(query: QueryBiDashboardDto) {
    const [kpis, trendResult, causes, districts, teams, breakdown] = await Promise.all([
      this.getExecutiveKpis(query),
      this.getTrend(query),
      this.getCausesBreakdown(query),
      this.getDistrictsAnalytics(query),
      this.getTeamsWorkload(query),
      this.getStatusAndPriorityBreakdown(query),
    ]);

    return {
      kpis,
      trendType: trendResult.trendType,
      trendLabel: trendResult.trendLabel,
      monthlyTrend: trendResult.data,
      trend: trendResult.data,
      causes,
      districts,
      teams,
      breakdown,
    };
  }
}
