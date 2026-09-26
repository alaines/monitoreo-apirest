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

    // Filtro por característica (I = Incidencia, T = Trabajo / Mantenimiento)
    if (filtros.caracteristica) {
      if (filtros.caracteristica === 'I') {
        where.incidencia = {
          ...where.incidencia,
          OR: [{ caracteristica: 'I' }, { caracteristica: null }],
        };
      } else if (filtros.caracteristica === 'T') {
        where.incidencia = {
          ...where.incidencia,
          caracteristica: 'T',
        };
      }
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
        if (filtros.dia && filtros.mes && filtros.anio) {
          // Usar los valores proporcionados por el usuario
          inicio = new Date(filtros.anio, filtros.mes - 1, filtros.dia);
          fin = new Date(filtros.anio, filtros.mes - 1, filtros.dia, 23, 59, 59);
        } else {
          // Fallback al día actual
          inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
          fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);
        }
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

    // Filtro por característica (I = Incidencia, T = Trabajo / Mantenimiento)
    const caracteristica = filtros.caracteristica !== undefined ? filtros.caracteristica : 'I';
    if (caracteristica) {
      if (caracteristica === 'I') {
        where.incidencia = {
          ...where.incidencia,
          OR: [{ caracteristica: 'I' }, { caracteristica: null }],
        };
      } else if (caracteristica === 'T') {
        where.incidencia = {
          ...where.incidencia,
          caracteristica: 'T',
        };
      }
    }

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

    // Buscar el registro padre "PROBLEMA - CRUCE" si aplica para incidencias
    const problemaCruceParent = await this.prisma.incidencia.findFirst({
      where: { 
        tipo: 'PROBLEMA - CRUCE',
        estado: true,
      },
    });

    // Configurar consulta de tipos de incidencias según la característica
    const whereTipos: any = { estado: true };
    if (caracteristica === 'T') {
      whereTipos.caracteristica = 'T';
      whereTipos.parentId = { not: null };
    } else if (caracteristica === 'I') {
      whereTipos.caracteristica = 'I';
      if (problemaCruceParent) {
        whereTipos.parentId = problemaCruceParent.id;
      } else {
        whereTipos.parentId = { not: null };
      }
    } else {
      whereTipos.parentId = { not: null };
    }

    // Obtener todos los tipos de incidencias únicos según la característica
    const tiposIncidencias = await this.prisma.incidencia.findMany({
      where: whereTipos,
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
    const evolucionTemporalTotal: Record<string, number> = {};
    const conteoTipos: Record<string, number> = {};
    const evolucionPorTipo: Record<string, Record<string, number>> = {};

    // 1. Contar ocurrencias por tipo de incidencia para encontrar los 4 más reportados
    tickets.forEach(ticket => {
      const tipoNombre = ticket.incidencia?.tipo || 'OTROS';
      conteoTipos[tipoNombre] = (conteoTipos[tipoNombre] || 0) + 1;
    });

    const top4Tipos = Object.entries(conteoTipos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([tipo]) => tipo);

    top4Tipos.forEach(tipo => {
      evolucionPorTipo[tipo] = {};
    });

    // 2. Agrupar por clave temporal y por tipo
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
            clave = clave.charAt(0).toUpperCase() + clave.slice(1);
            break;
          
          default:
            clave = fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        }
        
        evolucionTemporalTotal[clave] = (evolucionTemporalTotal[clave] || 0) + 1;

        const tipoNombre = ticket.incidencia?.tipo || 'OTROS';
        if (evolucionPorTipo[tipoNombre]) {
          evolucionPorTipo[tipoNombre][clave] = (evolucionPorTipo[tipoNombre][clave] || 0) + 1;
        }
      }
    });

    // Ordenar las claves según el periodo
    let categoriasEvolucion: string[] = [];
    
    if (filtros.periodo === PeriodoReporte.DIA) {
      categoriasEvolucion = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    } else if (filtros.periodo === PeriodoReporte.MES) {
      const diasEnMes = (filtros.mes && [4, 6, 9, 11].includes(Number(filtros.mes))) 
        ? 30 
        : (filtros.mes && Number(filtros.mes) === 2 ? 29 : 31);
      categoriasEvolucion = Array.from({ length: diasEnMes }, (_, i) => (i + 1).toString().padStart(2, '0'));
    } else if (filtros.periodo === PeriodoReporte.ANIO) {
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      categoriasEvolucion = meses;
    } else {
      categoriasEvolucion = Object.keys(evolucionTemporalTotal).sort();
    }

    // Datos de evolución simple para retrocompatibilidad
    const datosEvolucion = categoriasEvolucion.map(cat => ({
      mes: cat,
      cantidad: evolucionTemporalTotal[cat] || 0,
    }));

    // Series completas para el gráfico: Total + 4 tipos principales
    const seriesEvolucion = [
      {
        name: 'Total Incidencias',
        data: categoriasEvolucion.map(cat => evolucionTemporalTotal[cat] || 0),
      },
      ...top4Tipos.map(tipo => ({
        name: tipo,
        data: categoriasEvolucion.map(cat => evolucionPorTipo[tipo]?.[cat] || 0),
      })),
    ];

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
    const tiposProblemasCruceIds = new Set(tiposIncidencias.map(t => t.id));
    const ticketsProblemasCruce = tiposProblemasCruceIds.size > 0 
      ? tickets.filter(t => t.incidenciaId && tiposProblemasCruceIds.has(t.incidenciaId))
      : tickets;
    
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
        evolucion: {
          categorias: categoriasEvolucion,
          series: seriesEvolucion,
          topTipos: top4Tipos,
        },
        porEstado: datosPorEstado,
        top5Averias: top5Averias,
      },
      tiposIncidencias: tiposIncidencias.map((t: any) => t.tipo),
    };
  }

  // Generar Excel consolidado tipo pivot con encabezados descriptivos y formato profesional
  async generarExcelGrafico(filtros: ReporteIncidenciasDto) {
    const datos = await this.getReporteGrafico(filtros);
    const workbook = new ExcelJS.Workbook();
    
    // Período formateado en texto
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    let periodoTexto = '';
    if (filtros.periodo === 'MES') {
      const nombreMes = meses[(filtros.mes || 1) - 1] || '';
      periodoTexto = `${nombreMes} ${filtros.anio || new Date().getFullYear()}`;
    } else if (filtros.periodo === 'ANIO') {
      periodoTexto = `Año ${filtros.anio || new Date().getFullYear()}`;
    } else if (filtros.periodo === 'DIA') {
      periodoTexto = `${filtros.dia}/${filtros.mes}/${filtros.anio}`;
    } else if (filtros.fechaInicio && filtros.fechaFin) {
      periodoTexto = `${filtros.fechaInicio} al ${filtros.fechaFin}`;
    } else {
      periodoTexto = `Todos los registros`;
    }
    const caracteristica = filtros.caracteristica !== undefined ? filtros.caracteristica : 'I';
    const caracTexto = caracteristica === 'I' 
      ? 'Incidencias / Averías (I)' 
      : caracteristica === 'T' 
      ? 'Trabajos Programados (T)' 
      : 'Todas (I + T)';
    const fechaEmision = new Date().toLocaleString('es-PE');

    // =========================================================================
    // HOJA 1: RESUMEN CONSOLIDADO
    // =========================================================================
    const hojaConsolidada = workbook.addWorksheet('Resumen Consolidado');
    const totalCols1 = 2 + datos.tiposIncidencias.length + 1; // Cruce, Administrador, Tipos..., Total

    // Fila 1: Título Principal
    hojaConsolidada.mergeCells(1, 1, 1, totalCols1);
    const r1 = hojaConsolidada.getCell(1, 1);
    r1.value = 'SISTEMA DE MONITOREO DE SEMÁFOROS - PROTRÁNSITO';
    r1.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    r1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D546D' } };
    r1.alignment = { vertical: 'middle', horizontal: 'center' };
    hojaConsolidada.getRow(1).height = 26;

    // Fila 2: Subtítulo
    hojaConsolidada.mergeCells(2, 1, 2, totalCols1);
    const r2 = hojaConsolidada.getCell(2, 1);
    r2.value = 'Reporte Estadístico Consolidado de Incidencias y Averías';
    r2.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    r2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5F9598' } };
    r2.alignment = { vertical: 'middle', horizontal: 'center' };
    hojaConsolidada.getRow(2).height = 20;

    // Fila 3: Metadatos (Período, Característica, Fecha, Totales)
    hojaConsolidada.mergeCells(3, 1, 3, totalCols1);
    const r3 = hojaConsolidada.getCell(3, 1);
    r3.value = `Período: ${periodoTexto}   |   Característica: ${caracTexto}   |   Fecha de Emisión: ${fechaEmision}   |   Total Incidencias: ${datos.resumen.totalIncidencias}   |   Cruces Afectados: ${datos.resumen.totalCruces}`;
    r3.font = { name: 'Arial', size: 9.5, italic: true, color: { argb: 'FF334155' } };
    r3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    r3.alignment = { vertical: 'middle', horizontal: 'center' };
    hojaConsolidada.getRow(3).height = 18;

    // Fila 4: Espaciador
    hojaConsolidada.getRow(4).height = 8;

    // Fila 5: Encabezados de Columnas
    const headers1 = ['CRUCE / INTERSECCIÓN', 'ADMINISTRADOR', ...datos.tiposIncidencias.map((t: string) => t.toUpperCase()), 'TOTAL'];
    const rowHeader1 = hojaConsolidada.getRow(5);
    rowHeader1.values = headers1;
    rowHeader1.height = 24;
    rowHeader1.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D546D' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
    });

    // Filas de Datos
    let currentRowNum1 = 6;
    datos.consolidado.forEach((item: any, idx: number) => {
      const rowValues = [
        item.cruce,
        item.administrador,
        ...datos.tiposIncidencias.map((tipo: string) => item.tipos[tipo] || 0),
        item.total,
      ];
      const row = hojaConsolidada.getRow(currentRowNum1);
      row.values = rowValues;
      row.height = 18;

      const isEven = idx % 2 === 0;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 9, color: { argb: 'FF1E293B' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        if (colNumber === 1 || colNumber === 2) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          if (colNumber === totalCols1) {
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF1D546D' } };
          }
        }
      });

      currentRowNum1++;
    });

    // Fila de Totales
    const totalsValues1 = [
      'TOTAL GENERAL',
      '',
      ...datos.tiposIncidencias.map((tipo: string) => datos.graficos.porTipo.find((t: any) => t.tipo === tipo)?.cantidad || 0),
      datos.resumen.totalIncidencias,
    ];
    const totalRow1 = hojaConsolidada.getRow(currentRowNum1);
    totalRow1.values = totalsValues1;
    totalRow1.height = 22;
    totalRow1.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF94A3B8' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'double', color: { argb: 'FF475569' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
      cell.alignment = { vertical: 'middle', horizontal: colNumber <= 2 ? 'left' : 'center' };
    });

    // Ancho de columnas Hoja 1
    hojaConsolidada.getColumn(1).width = 38;
    hojaConsolidada.getColumn(2).width = 25;
    for (let i = 0; i < datos.tiposIncidencias.length; i++) {
      const tipoName = datos.tiposIncidencias[i];
      hojaConsolidada.getColumn(3 + i).width = Math.max(14, tipoName.length + 3);
    }
    hojaConsolidada.getColumn(totalCols1).width = 14;

    // =========================================================================
    // HOJA 2: LISTADO DETALLADO
    // =========================================================================
    const whereTickets: any = {
      incidencia: {
        caracteristica: 'I',
      },
    };
    if (filtros.periodo) {
      const fechas = this.calcularRangoFechas(filtros);
      whereTickets.createdAt = { gte: fechas.inicio, lte: fechas.fin };
    } else if (filtros.fechaInicio && filtros.fechaFin) {
      whereTickets.createdAt = { gte: new Date(filtros.fechaInicio), lte: new Date(filtros.fechaFin) };
    }
    if (filtros.tipoIncidencia) whereTickets.incidenciaId = filtros.tipoIncidencia;
    if (filtros.estadoId) whereTickets.estadoId = filtros.estadoId;
    if (filtros.cruceId) whereTickets.cruceId = filtros.cruceId;
    if (filtros.administradorId) {
      whereTickets.cruce = { administradorId: filtros.administradorId };
    }

    const tickets = await this.prisma.ticket.findMany({
      where: whereTickets,
      include: {
        cruce: { include: { administrador: true } },
        incidencia: true,
        estado: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const hojaDetalle = workbook.addWorksheet('Listado Detallado');
    const totalCols2 = 9;

    // Fila 1: Título Principal
    hojaDetalle.mergeCells(1, 1, 1, totalCols2);
    const d1 = hojaDetalle.getCell(1, 1);
    d1.value = 'SISTEMA DE MONITOREO DE SEMÁFOROS - PROTRÁNSITO';
    d1.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    d1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D546D' } };
    d1.alignment = { vertical: 'middle', horizontal: 'center' };
    hojaDetalle.getRow(1).height = 26;

    // Fila 2: Subtítulo
    hojaDetalle.mergeCells(2, 1, 2, totalCols2);
    const d2 = hojaDetalle.getCell(2, 1);
    d2.value = 'Listado Detallado de Incidencias Registradas';
    d2.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    d2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5F9598' } };
    d2.alignment = { vertical: 'middle', horizontal: 'center' };
    hojaDetalle.getRow(2).height = 20;

    // Fila 3: Metadatos
    hojaDetalle.mergeCells(3, 1, 3, totalCols2);
    const d3 = hojaDetalle.getCell(3, 1);
    d3.value = `Período de Análisis: ${periodoTexto}   |   Fecha de Emisión: ${fechaEmision}   |   Total Registros: ${tickets.length}`;
    d3.font = { name: 'Arial', size: 9.5, italic: true, color: { argb: 'FF334155' } };
    d3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    d3.alignment = { vertical: 'middle', horizontal: 'center' };
    hojaDetalle.getRow(3).height = 18;

    // Fila 4: Espaciador
    hojaDetalle.getRow(4).height = 8;

    // Fila 5: Encabezados de Columnas
    const headers2 = ['N°', 'FECHA Y HORA', 'TIPO DE INCIDENCIA', 'CRUCE / INTERSECCIÓN', 'ADMINISTRADOR', 'DETALLE / DESCRIPCIÓN', 'ESTADO', 'DÍA', 'MES'];
    const rowHeader2 = hojaDetalle.getRow(5);
    rowHeader2.values = headers2;
    rowHeader2.height = 24;
    rowHeader2.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D546D' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
    });

    // Filas de Datos
    let currentRowNum2 = 6;
    tickets.forEach((ticket, index) => {
      const fecha = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
      const rowValues = [
        index + 1,
        fecha.toLocaleString('es-PE'),
        ticket.incidencia?.tipo || 'N/A',
        ticket.cruce?.nombre || 'N/A',
        ticket.cruce?.administrador?.nombre || 'N/A',
        ticket.descripcion || '',
        ticket.estado?.nombre || 'N/A',
        fecha.toLocaleDateString('es-PE', { weekday: 'long' }).toUpperCase(),
        fecha.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase(),
      ];

      const row = hojaDetalle.getRow(currentRowNum2);
      row.values = rowValues;
      row.height = 18;

      const isEven = index % 2 === 0;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 9, color: { argb: 'FF1E293B' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        if (colNumber === 1 || colNumber === 7 || colNumber === 8 || colNumber === 9) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });

      currentRowNum2++;
    });

    // Anchos de columna Hoja 2
    hojaDetalle.getColumn(1).width = 7;
    hojaDetalle.getColumn(2).width = 20;
    hojaDetalle.getColumn(3).width = 26;
    hojaDetalle.getColumn(4).width = 35;
    hojaDetalle.getColumn(5).width = 24;
    hojaDetalle.getColumn(6).width = 40;
    hojaDetalle.getColumn(7).width = 16;
    hojaDetalle.getColumn(8).width = 14;
    hojaDetalle.getColumn(9).width = 15;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

