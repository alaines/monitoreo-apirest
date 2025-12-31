import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReporteIncidenciasDto, PeriodoReporte } from './dto/reporte-incidencias.dto';
import * as ExcelJS from 'exceljs';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  async getReporteIncidencias(filtros: ReporteIncidenciasDto) {
    const where: any = {};

    // Aplicar filtros de fecha
    if (filtros.periodo) {
      const fechas = this.calcularRangoFechas(filtros);
      where.createdAt = {
        gte: fechas.inicio,
        lte: fechas.fin,
      };
    } else if (filtros.fechaInicio && filtros.fechaFin) {
      where.createdAt = {
        gte: new Date(filtros.fechaInicio),
        lte: new Date(filtros.fechaFin),
      };
    }

    // Otros filtros
    if (filtros.tipoIncidencia) {
      where.incidenciaId = filtros.tipoIncidencia;
    }

    if (filtros.estadoId) {
      where.estadoId = filtros.estadoId;
    }

    if (filtros.cruceId) {
      where.cruceId = filtros.cruceId;
    }

    if (filtros.administradorId) {
      where.cruce = {
        administradorId: filtros.administradorId,
      };
    }

    const tickets = await this.prisma.ticket.findMany({
      where,
      include: {
        cruce: {
          include: {
            administrador: true,
            ubigeo: true,
          },
        },
        incidencia: true,
        equipo: true,
        reportador: true,
        estado: true,
        seguimientos: {
          include: {
            estado: true,
            responsable: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tickets;
  }

  private calcularRangoFechas(filtros: ReporteIncidenciasDto): { inicio: Date; fin: Date } {
    const ahora = new Date();
    let inicio: Date;
    let fin: Date = new Date();

    switch (filtros.periodo) {
      case PeriodoReporte.DIA:
        inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);
        break;

      case PeriodoReporte.MES:
        if (filtros.mes && filtros.anio) {
          inicio = new Date(filtros.anio, filtros.mes - 1, 1);
          fin = new Date(filtros.anio, filtros.mes, 0, 23, 59, 59);
        } else {
          inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
          fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);
        }
        break;

      case PeriodoReporte.ANIO:
        const anio = filtros.anio || ahora.getFullYear();
        inicio = new Date(anio, 0, 1);
        fin = new Date(anio, 11, 31, 23, 59, 59);
        break;

      case PeriodoReporte.PERSONALIZADO:
        inicio = filtros.fechaInicio ? new Date(filtros.fechaInicio) : new Date(ahora.getFullYear(), 0, 1);
        fin = filtros.fechaFin ? new Date(filtros.fechaFin) : ahora;
        break;

      default:
        inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        fin = ahora;
    }

    return { inicio, fin };
  }

  async generarExcel(filtros: ReporteIncidenciasDto): Promise<Buffer> {
    const tickets = await this.getReporteIncidencias(filtros);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Incidencias');

    // Configurar columnas
    worksheet.columns = [
      { header: 'Nro', key: 'nro', width: 8 },
      { header: 'Fecha y Hora', key: 'fechaHora', width: 20 },
      { header: 'Incidencia', key: 'incidencia', width: 25 },
      { header: 'Tipo', key: 'tipo', width: 30 },
      { header: 'Cruce', key: 'cruce', width: 40 },
      { header: 'Asignado a', key: 'asignado', width: 20 },
      { header: 'Detalle', key: 'detalle', width: 50 },
      { header: 'Estado', key: 'estado', width: 20 },
      { header: 'Día', key: 'dia', width: 12 },
      { header: 'Mes', key: 'mes', width: 12 },
      { header: 'Tiempo de Atención', key: 'tiempoAtencion', width: 20 },
      { header: 'Administrador', key: 'administrador', width: 20 },
      { header: 'Distrito', key: 'distrito', width: 20 },
    ];

    // Estilo del encabezado
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' },
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Agregar datos
    tickets.forEach((ticket, index) => {
      const fechaCreacion = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
      const fechaCierre = ticket.updatedAt && ticket.estadoId === 3 ? new Date(ticket.updatedAt) : null;
      const ultimoSeguimiento = ticket.seguimientos && ticket.seguimientos.length > 0 ? ticket.seguimientos[0] : null;

      worksheet.addRow({
        nro: index + 1,
        fechaHora: fechaCreacion.toLocaleString('es-PE'),
        incidencia: ticket.incidencia?.tipo || 'Sin tipo',
        tipo: ticket.incidencia?.tipo || 'N/A',
        cruce: ticket.cruce ? `${ticket.cruce.codigo} - ${ticket.cruce.nombre}` : 'N/A',
        asignado: ultimoSeguimiento?.responsable?.nombre || ticket.equipo?.nombre || 'Sin asignar',
        detalle: ticket.descripcion || 'Sin detalle',
        estado: ticket.estado?.nombre || ultimoSeguimiento?.estado?.nombre || 'PENDIENTE',
        dia: fechaCreacion.toLocaleDateString('es-PE', { weekday: 'long' }),
        mes: fechaCreacion.toLocaleDateString('es-PE', { month: 'long' }),
        tiempoAtencion: fechaCierre ? Math.round((fechaCierre.getTime() - fechaCreacion.getTime()) / (1000 * 60)) + ' min' : 'N/A',
        administrador: ticket.cruce?.administrador?.nombre || 'N/A',
        distrito: ticket.cruce?.ubigeo?.distrito || 'N/A',
      });
    });

    // Aplicar bordes a todas las celdas
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Auto-ajustar altura de filas
    worksheet.eachRow((row) => {
      row.height = 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async getEstadisticas(filtros: ReporteIncidenciasDto) {
    const tickets = await this.getReporteIncidencias(filtros);

    return {
      total: tickets.length,
      porTipo: this.generarResumenPorTipo(tickets),
      porEstado: this.generarResumenPorEstado(tickets),
      porMes: this.generarResumenPorMes(tickets),
      porAdministrador: this.generarResumenPorAdministrador(tickets),
    };
  }

  private generarResumenPorTipo(tickets: any[]): any[] {
    const agrupado = tickets.reduce((acc, ticket) => {
      const tipo = ticket.incidencia?.tipo || 'Sin tipo';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    const total = tickets.length;
    return Object.entries(agrupado).map(([tipo, cantidad]) => ({
      tipo,
      cantidad,
      porcentaje: ((cantidad as number / total) * 100).toFixed(1),
    }));
  }

  private generarResumenPorEstado(tickets: any[]): any[] {
    const agrupado = tickets.reduce((acc, ticket) => {
      const ultimoSeguimiento = ticket.seguimientos && ticket.seguimientos.length > 0 ? ticket.seguimientos[0] : null;
      const estado = ultimoSeguimiento?.estado?.nombre || 'PENDIENTE';
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {});

    const total = tickets.length;
    return Object.entries(agrupado).map(([estado, cantidad]) => ({
      estado,
      cantidad,
      porcentaje: ((cantidad as number / total) * 100).toFixed(1),
    }));
  }

  private generarResumenPorMes(tickets: any[]): any[] {
    const agrupado = tickets.reduce((acc, ticket) => {
      const fecha = new Date(ticket.createdAt);
      const mes = fecha.toLocaleDateString('es-PE', { year: 'numeric', month: 'long' });
      acc[mes] = (acc[mes] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(agrupado).map(([mes, cantidad]) => ({
      mes,
      cantidad,
    }));
  }

  private generarResumenPorAdministrador(tickets: any[]): any[] {
    const agrupado = tickets.reduce((acc, ticket) => {
      const admin = ticket.cruce?.administrador?.nombre || 'Sin administrador';
      acc[admin] = (acc[admin] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(agrupado).map(([administrador, cantidad]) => ({
      administrador,
      cantidad,
    }));
  }

  // Nuevo método para reporte gráfico consolidado
  async getReporteGrafico(filtros: ReporteIncidenciasDto) {
    const where: any = {};

    // Aplicar filtros de fecha
    if (filtros.periodo) {
      const fechas = this.calcularRangoFechas(filtros);
      where.createdAt = {
        gte: fechas.inicio,
        lte: fechas.fin,
      };
    } else if (filtros.fechaInicio && filtros.fechaFin) {
      where.createdAt = {
        gte: new Date(filtros.fechaInicio),
        lte: new Date(filtros.fechaFin),
      };
    }

    // Otros filtros
    if (filtros.tipoIncidencia) {
      where.incidenciaId = filtros.tipoIncidencia;
    }

    if (filtros.estadoId) {
      where.estadoId = filtros.estadoId;
    }

    if (filtros.cruceId) {
      where.cruceId = filtros.cruceId;
    }

    if (filtros.administradorId) {
      where.cruce = {
        administradorId: filtros.administradorId,
      };
    }

    // Obtener todos los tickets con sus relaciones
    const tickets = await this.prisma.ticket.findMany({
      where,
      include: {
        cruce: {
          include: {
            administrador: true,
          },
        },
        incidencia: true,
        estado: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Buscar el registro padre "PROBLEMA - CRUCE"
    const problemaCruceParent = await this.prisma.incidencia.findFirst({
      where: { 
        tipo: 'PROBLEMA - CRUCE',
        estado: true,
      },
    });

    // Obtener todos los tipos de incidencias únicos que son hijos de "PROBLEMA - CRUCE"
    const tiposIncidencias = await this.prisma.incidencia.findMany({
      where: { 
        estado: true,
        parentId: problemaCruceParent?.id || null,
      },
      orderBy: { tipo: 'asc' },
      select: {
        id: true,
        tipo: true,
        caracteristica: true,
      },
    });

    // Agrupar por cruce y tipo de incidencia (similar a Hoja1 del Excel)
    const consolidado: Record<string, {
      cruce: string;
      administrador: string;
      tipos: Record<string, number>;
      total: number;
    }> = {};
    
    tickets.forEach(ticket => {
      const cruceNombre = ticket.cruce?.nombre || 'SIN CRUCE';
      const tipoNombre = ticket.incidencia?.tipo || 'SIN TIPO';
      
      if (!consolidado[cruceNombre]) {
        consolidado[cruceNombre] = {
          cruce: cruceNombre,
          administrador: ticket.cruce?.administrador?.nombre || 'N/A',
          tipos: {},
          total: 0,
        };
      }
      
      if (!consolidado[cruceNombre].tipos[tipoNombre]) {
        consolidado[cruceNombre].tipos[tipoNombre] = 0;
      }
      
      consolidado[cruceNombre].tipos[tipoNombre]++;
      consolidado[cruceNombre].total++;
    });

    // Convertir a array para facilitar uso en frontend
    const datosConsolidados = Object.values(consolidado);

    // Preparar datos para gráficos - solo tipos bajo "PROBLEMA - CRUCE"
    const incidenciasPorTipo = tiposIncidencias.map((tipo: any) => ({
      tipo: tipo.tipo,
      cantidad: tickets.filter(t => t.incidencia?.tipo === tipo.tipo).length,
    }));

    const incidenciasPorCruce = datosConsolidados.map(item => ({
      cruce: item.cruce,
      cantidad: item.total,
    }));

    // Incidencias por periodo (adaptativo según tipo de periodo)
    const evolucionTemporal: Record<string, number> = {};
    
    tickets.forEach(ticket => {
      if (ticket.createdAt) {
        const fecha = new Date(ticket.createdAt);
        let clave: string;
        
        switch (filtros.periodo) {
          case PeriodoReporte.DIA:
            // Por hora del día (00:00, 01:00, ..., 23:00)
            clave = `${fecha.getHours().toString().padStart(2, '0')}:00`;
            break;
          
          case PeriodoReporte.MES:
            // Por días del mes (01, 02, ..., 31)
            clave = fecha.getDate().toString().padStart(2, '0');
            break;
          
          case PeriodoReporte.ANIO:
            // Por meses del año (Enero, Febrero, ...)
            clave = fecha.toLocaleString('es-ES', { month: 'long' });
            break;
          
          default:
            clave = fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        }
        
        evolucionTemporal[clave] = (evolucionTemporal[clave] || 0) + 1;
      }
    });

    // Ordenar las claves según el periodo
    let datosEvolucion: { mes: string; cantidad: number }[];
    
    if (filtros.periodo === PeriodoReporte.DIA) {
      // Ordenar por hora (00:00 a 23:00)
      const horas = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
      datosEvolucion = horas.map(hora => ({
        mes: hora,
        cantidad: evolucionTemporal[hora] || 0,
      }));
    } else if (filtros.periodo === PeriodoReporte.MES) {
      // Ordenar por día del mes (01 a 31)
      const dias = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
      datosEvolucion = dias.map(dia => ({
        mes: dia,
        cantidad: evolucionTemporal[dia] || 0,
      }));
    } else if (filtros.periodo === PeriodoReporte.ANIO) {
      // Ordenar por meses del año
      const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                     'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      datosEvolucion = meses.map(mes => ({
        mes: mes.charAt(0).toUpperCase() + mes.slice(1),
        cantidad: evolucionTemporal[mes] || 0,
      }));
    } else {
      // Personalizado o por defecto
      datosEvolucion = Object.entries(evolucionTemporal)
        .map(([mes, cantidad]) => ({ mes, cantidad }))
        .sort((a, b) => a.mes.localeCompare(b.mes));
    }

    // Incidencias por estado
    const incidenciasPorEstado: Record<string, number> = {};
    tickets.forEach(ticket => {
      const estado = ticket.estado?.nombre || 'SIN ESTADO';
      incidenciasPorEstado[estado] = (incidenciasPorEstado[estado] || 0) + 1;
    });

    const datosPorEstado = Object.entries(incidenciasPorEstado).map(([estado, cantidad]) => ({
      estado,
      cantidad,
    }));

    // Top 5 tipos de averías con atendidas vs por atender
    // Solo considerar incidencias bajo "PROBLEMA - CRUCE"
    const tiposProblemasCruceIds = new Set(tiposIncidencias.map(t => t.id));
    const ticketsProblemasCruce = tickets.filter(t => 
      t.incidenciaId && tiposProblemasCruceIds.has(t.incidenciaId)
    );
    
    const rankingAverias: Record<string, { total: number; atendidas: number; porAtender: number }> = {};
    
    ticketsProblemasCruce.forEach(ticket => {
      const tipoNombre = ticket.incidencia?.tipo || 'SIN TIPO';
      const estadoNombre = ticket.estado?.nombre || '';
      
      if (!rankingAverias[tipoNombre]) {
        rankingAverias[tipoNombre] = { total: 0, atendidas: 0, porAtender: 0 };
      }
      
      rankingAverias[tipoNombre].total++;
      
      // Considerar como atendidas: ATENDIDO, CERRADO, FINALIZADO, RESUELTO, COMPLETADO
      const estadoUpper = estadoNombre.toUpperCase();
      if (estadoUpper.includes('ATENDIDO') || 
          estadoUpper.includes('CERRADO') || 
          estadoUpper.includes('FINALIZADO') || 
          estadoUpper.includes('RESUELTO') || 
          estadoUpper.includes('COMPLETADO')) {
        rankingAverias[tipoNombre].atendidas++;
      } else {
        // Por atender: PENDIENTE, EN PROCESO, ASIGNADO, y cualquier otro
        rankingAverias[tipoNombre].porAtender++;
      }
    });

    // Ordenar por total y tomar top 5
    const top5Averias = Object.entries(rankingAverias)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([tipo, datos]) => ({
        tipo,
        total: datos.total,
        atendidas: datos.atendidas,
        porAtender: datos.porAtender,
      }));

    return {
      resumen: {
        totalIncidencias: tickets.length,
        totalCruces: Object.keys(consolidado).length,
        totalTipos: tiposIncidencias.length,
      },
      consolidado: datosConsolidados,
      graficos: {
        porTipo: incidenciasPorTipo,
        porCruce: incidenciasPorCruce.slice(0, 10), // Top 10 cruces
        porMes: datosEvolucion,
        porEstado: datosPorEstado,
        top5Averias: top5Averias,
      },
      tiposIncidencias: tiposIncidencias.map((t: any) => t.tipo),
    };
  }

  // Generar Excel consolidado tipo pivot (basado en reporte_grafico.xlsx)
  async generarExcelGrafico(filtros: ReporteIncidenciasDto) {
    const datos = await this.getReporteGrafico(filtros);
    const workbook = new ExcelJS.Workbook();
    
    // Hoja 1: Datos Consolidados
    const hojaConsolidada = workbook.addWorksheet('Consolidado');
    
    // Definir columnas dinámicas
    const columnas: any[] = [
      { header: 'CRUCE', key: 'cruce', width: 30 },
      { header: 'ADMINISTRADOR', key: 'administrador', width: 25 },
    ];
    
    // Agregar columna por cada tipo de incidencia
    datos.tiposIncidencias.forEach((tipo: string) => {
      columnas.push({ header: tipo.toUpperCase(), key: tipo, width: 15 });
    });
    
    columnas.push({ header: 'TOTAL', key: 'total', width: 12 });
    
    hojaConsolidada.columns = columnas;
    
    // Estilos de encabezado
    hojaConsolidada.getRow(1).font = { bold: true };
    hojaConsolidada.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    hojaConsolidada.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    // Agregar datos
    datos.consolidado.forEach((item: any) => {
      const row: any = {
        cruce: item.cruce,
        administrador: item.administrador,
        total: item.total,
      };
      
      // Llenar cantidades por tipo
      datos.tiposIncidencias.forEach((tipo: string) => {
        row[tipo] = item.tipos[tipo] || 0;
      });
      
      hojaConsolidada.addRow(row);
    });
    
    // Fila de totales
    const rowTotal: any = {
      cruce: 'TOTAL GENERAL',
      administrador: '',
      total: datos.resumen.totalIncidencias,
    };
    
    datos.tiposIncidencias.forEach((tipo: string) => {
      rowTotal[tipo] = datos.graficos.porTipo.find((t: any) => t.tipo === tipo)?.cantidad || 0;
    });
    
    const totalRow = hojaConsolidada.addRow(rowTotal);
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' },
    };
    
    // Hoja 2: Listado Detallado
    const where: any = {};
    if (filtros.periodo) {
      const fechas = this.calcularRangoFechas(filtros);
      where.createdAt = { gte: fechas.inicio, lte: fechas.fin };
    }
    if (filtros.tipoIncidencia) where.incidenciaId = filtros.tipoIncidencia;
    if (filtros.estadoId) where.estadoId = filtros.estadoId;
    if (filtros.cruceId) where.cruceId = filtros.cruceId;
    if (filtros.administradorId) {
      where.cruce = { administradorId: filtros.administradorId };
    }
    
    const tickets = await this.prisma.ticket.findMany({
      where,
      include: {
        cruce: { include: { administrador: true } },
        incidencia: true,
        estado: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    const hojaDetalle = workbook.addWorksheet('Listado Detallado');
    hojaDetalle.columns = [
      { header: 'Nro', key: 'nro', width: 8 },
      { header: 'FECHA Y HORA', key: 'fecha', width: 20 },
      { header: 'TIPO', key: 'tipo', width: 25 },
      { header: 'CRUCE', key: 'cruce', width: 30 },
      { header: 'ASIGNADO A', key: 'asignado', width: 25 },
      { header: 'DETALLE', key: 'detalle', width: 40 },
      { header: 'ESTADO', key: 'estado', width: 20 },
      { header: 'DÍA', key: 'dia', width: 12 },
      { header: 'MES', key: 'mes', width: 15 },
    ];
    
    hojaDetalle.getRow(1).font = { bold: true };
    hojaDetalle.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    hojaDetalle.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    tickets.forEach((ticket, index) => {
      const fecha = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
      hojaDetalle.addRow({
        nro: index + 1,
        fecha: fecha.toLocaleString('es-ES'),
        tipo: ticket.incidencia?.tipo || 'N/A',
        cruce: ticket.cruce?.nombre || 'N/A',
        asignado: ticket.cruce?.administrador?.nombre || 'N/A',
        detalle: ticket.descripcion || '',
        estado: ticket.estado?.nombre || 'N/A',
        dia: fecha.toLocaleDateString('es-ES', { weekday: 'long' }).toUpperCase(),
        mes: fecha.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase(),
      });
    });
    
    return await workbook.xlsx.writeBuffer();
  }
}

