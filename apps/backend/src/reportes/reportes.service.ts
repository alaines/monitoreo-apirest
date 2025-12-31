import { Injectable, StreamableFile } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReporteIncidenciasDto, PeriodoReporte } from './dto/reporte-incidencias.dto';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

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
      const tiempoAtencion = this.calcularTiempoAtencion(fechaCreacion, fechaCierre);
      const ultimoSeguimiento = ticket.seguimientos && ticket.seguimientos.length > 0 ? ticket.seguimientos[0] : null;

      worksheet.addRow({
        nro: index + 1,
        fechaHora: fechaCreacion.toLocaleString('es-PE'),
        incidencia: ticket.incidencia?.tipo || 'Sin tipo',
        tipo: ticket.incidencia?.tipo || 'N/A',
        cruce: ticket.cruce ? `${ticket.cruce.codigo} - ${ticket.cruce.nombre}` : 'N/A',
        asignado: ultimoSeguimiento?.responsable?.nombre || ticket.equipo?.nombre || 'Sin asignar',
        detalle: ticket.descripcion || 'Sin detalle',
        estado: ultimoSeguimiento?.estado?.nombre || 'PENDIENTE',
        dia: fechaCreacion.toLocaleDateString('es-PE', { weekday: 'long' }),
        mes: fechaCreacion.toLocaleDateString('es-PE', { month: 'long' }),
        tiempoAtencion,
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

  async generarPDF(filtros: ReporteIncidenciasDto): Promise<Buffer> {
    const tickets = await this.getReporteIncidencias(filtros);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Título
      doc.fontSize(18).font('Helvetica-Bold').text('Reporte de Incidencias', { align: 'center' });
      doc.moveDown();

      // Información del reporte
      doc.fontSize(10).font('Helvetica');
      const rangoFechas = this.calcularRangoFechas(filtros);
      doc.text(`Periodo: ${rangoFechas.inicio.toLocaleDateString('es-PE')} - ${rangoFechas.fin.toLocaleDateString('es-PE')}`);
      doc.text(`Total de incidencias: ${tickets.length}`);
      doc.text(`Fecha de generación: ${new Date().toLocaleString('es-PE')}`);
      doc.moveDown();

      // Tabla de resumen por tipo
      const resumenPorTipo = this.generarResumenPorTipo(tickets);
      doc.fontSize(12).font('Helvetica-Bold').text('Resumen por Tipo de Incidencia');
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica');
      
      resumenPorTipo.forEach(item => {
        doc.text(`${item.tipo}: ${item.cantidad} (${item.porcentaje}%)`);
      });
      doc.moveDown();

      // Resumen por estado
      const resumenPorEstado = this.generarResumenPorEstado(tickets);
      doc.fontSize(12).font('Helvetica-Bold').text('Resumen por Estado');
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica');
      
      resumenPorEstado.forEach(item => {
        doc.text(`${item.estado}: ${item.cantidad} (${item.porcentaje}%)`);
      });
      doc.moveDown();

      // Lista detallada (página nueva)
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('Detalle de Incidencias', { align: 'center' });
      doc.moveDown();

      tickets.forEach((ticket, index) => {
        if (doc.y > 500) {
          doc.addPage();
        }

        const fechaCreacion = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
        const fechaCierre = ticket.updatedAt && ticket.estadoId === 3 ? new Date(ticket.updatedAt) : null;
        const tiempoAtencion = this.calcularTiempoAtencion(fechaCreacion, fechaCierre);
        const ultimoSeguimiento = ticket.seguimientos && ticket.seguimientos.length > 0 ? ticket.seguimientos[0] : null;

        doc.fontSize(10).font('Helvetica-Bold').text(`${index + 1}. ${ticket.incidencia?.tipo || 'Sin tipo'}`, { continued: false });
        doc.fontSize(9).font('Helvetica');
        doc.text(`   Fecha: ${fechaCreacion.toLocaleString('es-PE')}`);
        doc.text(`   Cruce: ${ticket.cruce ? `${ticket.cruce.codigo} - ${ticket.cruce.nombre}` : 'N/A'}`);
        doc.text(`   Tipo: ${ticket.incidencia?.tipo || 'N/A'}`);
        doc.text(`   Estado: ${ultimoSeguimiento?.estado?.nombre || 'PENDIENTE'}`);
        doc.text(`   Asignado a: ${ultimoSeguimiento?.responsable?.nombre || ticket.equipo?.nombre || 'Sin asignar'}`);
        doc.text(`   Tiempo de atención: ${tiempoAtencion}`);
        if (ticket.descripcion) {
          doc.text(`   Detalle: ${ticket.descripcion.substring(0, 100)}${ticket.descripcion.length > 100 ? '...' : ''}`);
        }
        doc.moveDown(0.5);
      });

      doc.end();
    });
  }

  private calcularTiempoAtencion(fechaInicio: Date, fechaFin: Date | null): string {
    if (!fechaFin) return 'En proceso';

    const diff = fechaFin.getTime() - fechaInicio.getTime();
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (horas > 24) {
      const dias = Math.floor(horas / 24);
      const horasRestantes = horas % 24;
      return `${dias}d ${horasRestantes}h ${minutos}m`;
    }

    return `${horas}h ${minutos}m`;
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
}
