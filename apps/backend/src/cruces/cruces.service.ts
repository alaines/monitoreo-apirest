import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCruceDto } from './dto/create-cruce.dto';
import { UpdateCruceDto } from './dto/update-cruce.dto';
import { QueryCrucesDto } from './dto/query-cruces.dto';
import { Prisma } from '@prisma/client';
import { readFile } from 'fs/promises';
import { join } from 'path';
import * as ExcelJS from 'exceljs';

@Injectable()
export class CrucesService {
  constructor(private prisma: PrismaService) {}

  async create(createCruceDto: CreateCruceDto, userId?: number) {
    const { ubigeoId, proyectoId, administradorId, via1, via2, ...resto } = createCruceDto;
    
    const data: any = {
      ...resto,
      ubigeo: { connect: { id: ubigeoId } },
      proyecto: { connect: { id: proyectoId } },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Manejar relaciones opcionales
    if (administradorId) {
      data.administrador = { connect: { id: administradorId } };
    }
    
    if (via1) {
      data.via1 = Number(via1);
    }
    
    if (via2) {
      data.via2 = Number(via2);
    }

    // Crear el cruce
    const cruce = await this.prisma.cruce.create({
      data,
      include: {
        ubigeo: true,
        proyecto: true,
        administrador: true,
        crucesPerifericos: {
          include: {
            periferico: true,
          },
        },
      },
    });

    return cruce;
  }

  private buildWhereClause(query: QueryCrucesDto) {
    const { search, codigo, estado, ubigeoId, proyectoId, administradorId, anho, estadoId } = query;
    const where: any = {};

    if (search) {
      where.nombre = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (codigo) {
      where.codigo = {
        contains: codigo,
        mode: 'insensitive',
      };
    }

    if (estado !== undefined) {
      where.estado = estado;
    }

    if (ubigeoId) {
      where.ubigeoId = ubigeoId;
    }

    if (proyectoId) {
      where.proyectoId = proyectoId;
    }

    if (administradorId) {
      where.administradorId = administradorId;
    }

    // Filtro por año y estado de tickets
    if (anho !== undefined || estadoId !== undefined) {
      where.tickets = {
        some: {
          ...(anho !== undefined && { anho }),
          ...(estadoId !== undefined && { estadoId }),
        },
      };
    }

    return where;
  }

  async findAll(query: QueryCrucesDto) {
    const { page = 1, limit = 10, sortBy = 'id', sortOrder = 'desc' } = query;
    const where = this.buildWhereClause(query);

    // Ordenamiento seguro
    let orderBy: any = { id: 'desc' };
    if (sortBy) {
      if (sortBy === 'distrito') {
        orderBy = { ubigeo: { distrito: sortOrder || 'asc' } };
      } else if (sortBy === 'administrador') {
        orderBy = { administrador: { nombre: sortOrder || 'asc' } };
      } else if (sortBy === 'proyecto') {
        orderBy = { proyecto: { nombre: sortOrder || 'asc' } };
      } else if (['codigo', 'nombre', 'estado', 'id', 'createdAt', 'updatedAt', 'via1', 'via2'].includes(sortBy)) {
        orderBy = { [sortBy]: sortOrder || 'asc' };
      } else {
        orderBy = { id: sortOrder || 'desc' };
      }
    }

    const [total, data] = await Promise.all([
      this.prisma.cruce.count({ where }),
      this.prisma.cruce.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          ubigeo: true,
          proyecto: true,
          administrador: true,
          crucesPerifericos: {
            include: {
              periferico: true,
            },
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene lista liviana y optimizada de cruces georreferenciados para visualización en mapa.
   * Reduce drásticamente el payload a solo campos indispensables con proyección directa.
   */
  async getMapaCruces(query: QueryCrucesDto) {
    const where = this.buildWhereClause(query);
    where.latitud = { not: null };
    where.longitud = { not: null };

    const cruces = await this.prisma.cruce.findMany({
      where,
      select: {
        id: true,
        codigo: true,
        nombre: true,
        latitud: true,
        longitud: true,
        administradorId: true,
        tipoGestion: true,
        tipoComunicacion: true,
        ubigeo: {
          select: {
            distrito: true,
          },
        },
        administrador: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return cruces.map((c) => ({
      id: c.id,
      codigo: c.codigo || '',
      nombre: c.nombre || '',
      latitud: c.latitud,
      longitud: c.longitud,
      administradorId: c.administradorId,
      tipoGestion: c.tipoGestion,
      tipoComunicacion: c.tipoComunicacion,
      distrito: c.ubigeo?.distrito || '',
      administradorNombre: c.administrador?.nombre || '',
      ubigeo: c.ubigeo ? { distrito: c.ubigeo.distrito } : undefined,
      administrador: c.administrador ? { nombre: c.administrador.nombre } : undefined,
    }));
  }

  async getResumenEjecutivo(query: QueryCrucesDto) {
    const where = this.buildWhereClause(query);

    const [cruces, tipos] = await Promise.all([
      this.prisma.cruce.findMany({
        where,
        include: {
          ubigeo: true,
          proyecto: true,
          administrador: true,
          crucesPerifericos: {
            include: {
              periferico: true,
            },
          },
        },
      }),
      this.prisma.tipo.findMany(),
    ]);

    const tipoMap = new Map<number, string>(tipos.map(t => [t.id, t.name || '']));

    const total = cruces.length;
    let activos = 0;
    let inactivos = 0;
    let conPlanoPdf = 0;
    let conPlanoDwg = 0;
    let conPerifericos = 0;
    let conCoordenadas = 0;

    const porTipoComunicacionMap = new Map<string, { id: number | null; nombre: string; cantidad: number; activos: number; inactivos: number }>();
    const porAdministradorMap = new Map<string, { id: number | null; nombre: string; cantidad: number; activos: number; inactivos: number }>();
    const porDistritoMap = new Map<string, { ubigeoId: string; distrito: string; provincia: string; cantidad: number; activos: number; inactivos: number }>();
    const porTipoControlMap = new Map<string, { id: number | null; nombre: string; cantidad: number }>();
    const porProyectoMap = new Map<string, { id: number | null; nombre: string; cantidad: number }>();

    cruces.forEach(c => {
      const esActivo = c.estado !== false;
      if (esActivo) activos++;
      else inactivos++;

      if (c.planoPdf) conPlanoPdf++;
      if (c.planoDwg) conPlanoDwg++;
      if (c.crucesPerifericos && c.crucesPerifericos.length > 0) conPerifericos++;
      if (c.latitud && c.longitud) conCoordenadas++;

      // Tipo Comunicacion
      const comNombre = (c.tipoComunicacion && tipoMap.get(c.tipoComunicacion)) || 'NO ESPECIFICADO';
      const comKey = comNombre.toUpperCase();
      const comEntry = porTipoComunicacionMap.get(comKey) || { id: c.tipoComunicacion || null, nombre: comNombre, cantidad: 0, activos: 0, inactivos: 0 };
      comEntry.cantidad++;
      if (esActivo) comEntry.activos++;
      else comEntry.inactivos++;
      porTipoComunicacionMap.set(comKey, comEntry);

      // Administrador
      const adminNombre = c.administrador?.nombre || 'SIN ADMINISTRADOR';
      const adminKey = adminNombre.toUpperCase();
      const adminEntry = porAdministradorMap.get(adminKey) || { id: c.administradorId || null, nombre: adminNombre, cantidad: 0, activos: 0, inactivos: 0 };
      adminEntry.cantidad++;
      if (esActivo) adminEntry.activos++;
      else adminEntry.inactivos++;
      porAdministradorMap.set(adminKey, adminEntry);

      // Distrito
      const distNombre = c.ubigeo?.distrito || 'NO ESPECIFICADO';
      const distKey = distNombre.toUpperCase();
      const distEntry = porDistritoMap.get(distKey) || { ubigeoId: c.ubigeoId || '', distrito: distNombre, provincia: c.ubigeo?.provincia || 'LIMA', cantidad: 0, activos: 0, inactivos: 0 };
      distEntry.cantidad++;
      if (esActivo) distEntry.activos++;
      else distEntry.inactivos++;
      porDistritoMap.set(distKey, distEntry);

      // Tipo Control
      const ctrlNombre = (c.tipoControl && tipoMap.get(c.tipoControl)) || 'NO ESPECIFICADO';
      const ctrlKey = ctrlNombre.toUpperCase();
      const ctrlEntry = porTipoControlMap.get(ctrlKey) || { id: c.tipoControl || null, nombre: ctrlNombre, cantidad: 0 };
      ctrlEntry.cantidad++;
      porTipoControlMap.set(ctrlKey, ctrlEntry);

      // Proyecto
      const proyNombre = c.proyecto?.nombre || 'SIN PROYECTO';
      const proyKey = proyNombre.toUpperCase();
      const proyEntry = porProyectoMap.get(proyKey) || { id: c.proyectoId || null, nombre: proyNombre, cantidad: 0 };
      proyEntry.cantidad++;
      porProyectoMap.set(proyKey, proyEntry);
    });

    const calcPorc = (cnt: number) => total > 0 ? Number(((cnt / total) * 100).toFixed(1)) : 0;

    return {
      totales: {
        total,
        activos,
        inactivos,
        porcentajeActivos: calcPorc(activos),
        conPlanoPdf,
        conPlanoDwg,
        conPlanosTotal: conPlanoPdf + conPlanoDwg,
        conPerifericos,
        conCoordenadas,
      },
      porTipoComunicacion: Array.from(porTipoComunicacionMap.values())
        .map(item => ({ ...item, porcentaje: calcPorc(item.cantidad) }))
        .sort((a, b) => b.cantidad - a.cantidad),
      porAdministrador: Array.from(porAdministradorMap.values())
        .map(item => ({ ...item, porcentaje: calcPorc(item.cantidad) }))
        .sort((a, b) => b.cantidad - a.cantidad),
      porDistrito: Array.from(porDistritoMap.values())
        .map(item => ({ ...item, porcentaje: calcPorc(item.cantidad) }))
        .sort((a, b) => b.cantidad - a.cantidad),
      porTipoControl: Array.from(porTipoControlMap.values())
        .map(item => ({ ...item, porcentaje: calcPorc(item.cantidad) }))
        .sort((a, b) => b.cantidad - a.cantidad),
      porProyecto: Array.from(porProyectoMap.values())
        .map(item => ({ ...item, porcentaje: calcPorc(item.cantidad) }))
        .sort((a, b) => b.cantidad - a.cantidad),
    };
  }

  async generarExcel(query: QueryCrucesDto): Promise<Buffer> {
    const where = this.buildWhereClause(query);
    const resumen = await this.getResumenEjecutivo(query);

    const [cruces, tipos] = await Promise.all([
      this.prisma.cruce.findMany({
        where,
        orderBy: [{ codigo: 'asc' }, { nombre: 'asc' }],
        include: {
          ubigeo: true,
          proyecto: true,
          administrador: true,
          crucesPerifericos: {
            include: {
              periferico: true,
            },
          },
        },
      }),
      this.prisma.tipo.findMany(),
    ]);

    const tipoMap = new Map<number, string>(tipos.map(t => [t.id, t.name || '']));

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Monitoreo - GMU / SGF';
    workbook.created = new Date();

    // Paleta de colores institucional
    const colorPrimary = 'FF1D546D';   // Azul primario
    const colorDark = 'FF061E29';      // Azul oscuro
    const colorLight = 'FFF3F4F4';     // Gris claro
    const colorZebra = 'FFF9FAFB';     // Zebra row

    // ==========================================
    // HOJA 1: LISTADO DE INTERSECCIONES
    // ==========================================
    const wsListado = workbook.addWorksheet('Listado de Intersecciones', {
      views: [{ showGridLines: true }]
    });

    const columns = [
      { header: 'N°', key: 'num', width: 6 },
      { header: 'CÓDIGO', key: 'codigo', width: 12 },
      { header: 'CÓD. ANTERIOR', key: 'codigoAnterior', width: 14 },
      { header: 'NOMBRE / INTERSECCIÓN', key: 'nombre', width: 44 },
      { header: 'DISTRITO', key: 'distrito', width: 22 },
      { header: 'PROVINCIA', key: 'provincia', width: 16 },
      { header: 'ESTADO', key: 'estado', width: 12 },
      { header: 'TIPO COMUNICACIÓN', key: 'tipoComunicacion', width: 24 },
      { header: 'ADMINISTRADOR / CONTRATISTA', key: 'administrador', width: 30 },
      { header: 'PROYECTO', key: 'proyecto', width: 25 },
      { header: 'TIPO CRUCE', key: 'tipoCruce', width: 20 },
      { header: 'TIPO CONTROL', key: 'tipoControl', width: 20 },
      { header: 'TIPO GESTIÓN', key: 'tipoGestion', width: 20 },
      { header: 'TIPO ESTRUCTURA', key: 'tipoEstructura', width: 20 },
      { header: 'LATITUD', key: 'latitud', width: 14 },
      { header: 'LONGITUD', key: 'longitud', width: 14 },
      { header: 'PERIFÉRICOS INSTALADOS', key: 'perifericos', width: 32 },
      { header: 'PLANO PDF', key: 'planoPdf', width: 14 },
      { header: 'PLANO DWG', key: 'planoDwg', width: 14 },
      { header: 'EMPRESA ELÉCTRICA', key: 'electricoEmpresa', width: 22 },
      { header: 'N° SUMINISTRO', key: 'electricoSuministro', width: 18 },
      { header: 'AÑO IMPL.', key: 'anoImplementacion', width: 12 },
      { header: 'OBSERVACIONES', key: 'observaciones', width: 35 },
      { header: 'FECHA REGISTRO', key: 'createdAt', width: 18 },
    ];

    const totalCols = columns.length;

    // Fila 1: Título Institucional
    wsListado.mergeCells(1, 1, 1, totalCols);
    const cellT1 = wsListado.getCell(1, 1);
    cellT1.value = 'SISTEMA DE MONITOREO - REPORTE GENERAL DE INTERSECCIONES SEMAFÓRICAS';
    cellT1.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    cellT1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorPrimary } };
    cellT1.alignment = { vertical: 'middle', horizontal: 'center' };
    wsListado.getRow(1).height = 32;

    // Fila 2: Subtítulo
    wsListado.mergeCells(2, 1, 2, totalCols);
    const cellT2 = wsListado.getCell(2, 1);
    cellT2.value = 'MUNICIPALIDAD METROPOLITANA DE LIMA | DIVISIÓN DE MONITOREO Y CONTROL - SGF / GMU';
    cellT2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: colorDark } };
    cellT2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorLight } };
    cellT2.alignment = { vertical: 'middle', horizontal: 'center' };
    wsListado.getRow(2).height = 22;

    // Fila 3: Metadatos
    wsListado.mergeCells(3, 1, 3, totalCols);
    const cellT3 = wsListado.getCell(3, 1);
    cellT3.value = `Fecha de emisión: ${new Date().toLocaleString('es-PE')} | Total de intersecciones: ${cruces.length} | Estado: ${resumen.totales.activos} Activas (${resumen.totales.porcentajeActivos}%)`;
    cellT3.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF555555' } };
    cellT3.alignment = { vertical: 'middle', horizontal: 'center' };
    wsListado.getRow(3).height = 20;

    // Fila 5: Headers de columnas
    const headerRow = wsListado.getRow(5);
    headerRow.height = 26;
    columns.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorPrimary } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFAAAAAA' } },
        bottom: { style: 'medium', color: { argb: colorDark } },
        left: { style: 'thin', color: { argb: 'FFAAAAAA' } },
        right: { style: 'thin', color: { argb: 'FFAAAAAA' } },
      };
      wsListado.getColumn(idx + 1).width = col.width;
    });

    // Filas de datos
    cruces.forEach((c, index) => {
      const rowIdx = index + 6;
      const row = wsListado.getRow(rowIdx);
      row.height = 20;
      const isEven = index % 2 === 0;
      const bg = isEven ? 'FFFFFFFF' : colorZebra;

      const perifsStr = (c.crucesPerifericos && c.crucesPerifericos.length > 0)
        ? c.crucesPerifericos.map(cp => cp.periferico?.modelo || cp.periferico?.fabricante || 'Periférico').join(', ')
        : 'Ninguno';

      const rowValues = [
        index + 1,
        c.codigo || 'S/C',
        c.codigoAnterior || '-',
        c.nombre || 'Sin nombre',
        c.ubigeo?.distrito || '-',
        c.ubigeo?.provincia || '-',
        c.estado !== false ? 'ACTIVO' : 'INACTIVO',
        (c.tipoComunicacion && tipoMap.get(c.tipoComunicacion)) || 'NO ESPECIFICADO',
        c.administrador?.nombre || 'SIN ADMINISTRADOR',
        c.proyecto?.nombre || 'SIN PROYECTO',
        (c.tipoCruce && tipoMap.get(c.tipoCruce)) || '-',
        (c.tipoControl && tipoMap.get(c.tipoControl)) || '-',
        (c.tipoGestion && tipoMap.get(c.tipoGestion)) || '-',
        (c.tipoEstructura && tipoMap.get(c.tipoEstructura)) || '-',
        c.latitud ?? '-',
        c.longitud ?? '-',
        perifsStr,
        c.planoPdf ? 'SÍ' : 'NO',
        c.planoDwg ? 'SÍ' : 'NO',
        c.electricoEmpresa || '-',
        c.electricoSuministro || '-',
        c.anoImplementacion || '-',
        c.observaciones || '-',
        c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-PE') : '-',
      ];

      rowValues.forEach((val, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        cell.value = val;
        cell.font = { name: 'Segoe UI', size: 9 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };

        // Alineación
        if ([1, 2, 3, 7, 15, 16, 18, 19, 22, 24].includes(cIdx + 1)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }

        // Color para Estado
        if (cIdx + 1 === 7) {
          if (val === 'ACTIVO') {
            cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF166534' } };
          } else {
            cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF991B1B' } };
          }
        }
      });
    });

    // Auto filtro
    wsListado.autoFilter = {
      from: { row: 5, column: 1 },
      to: { row: 5 + cruces.length, column: totalCols }
    };

    // ==========================================
    // HOJA 2: RESUMEN EJECUTIVO Y ESTADÍSTICAS
    // ==========================================
    const wsResumen = workbook.addWorksheet('Resumen Ejecutivo', {
      views: [{ showGridLines: true }]
    });

    wsResumen.mergeCells('A1:G1');
    const rT1 = wsResumen.getCell('A1');
    rT1.value = 'RESUMEN EJECUTIVO Y ESTADÍSTICAS DE INTERSECCIONES';
    rT1.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    rT1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorPrimary } };
    rT1.alignment = { vertical: 'middle', horizontal: 'center' };
    wsResumen.getRow(1).height = 28;

    // Tabla 1: Totales Generales
    wsResumen.getCell('A3').value = 'INDICADOR GENERAL';
    wsResumen.getCell('B3').value = 'CANTIDAD';
    wsResumen.getCell('C3').value = 'PORCENTAJE';
    ['A3', 'B3', 'C3'].forEach(pos => {
      const c = wsResumen.getCell(pos);
      c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorDark } };
      c.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const kpiRows = [
      ['Total de Intersecciones', resumen.totales.total, '100%'],
      ['Intersecciones Activas', resumen.totales.activos, `${resumen.totales.porcentajeActivos}%`],
      ['Intersecciones Inactivas', resumen.totales.inactivos, `${(100 - resumen.totales.porcentajeActivos).toFixed(1)}%`],
      ['Con Planos Técnicos (PDF)', resumen.totales.conPlanoPdf, `${((resumen.totales.conPlanoPdf / (resumen.totales.total || 1)) * 100).toFixed(1)}%`],
      ['Con Planos Técnicos (DWG)', resumen.totales.conPlanoDwg, `${((resumen.totales.conPlanoDwg / (resumen.totales.total || 1)) * 100).toFixed(1)}%`],
      ['Con Periféricos Instalados', resumen.totales.conPerifericos, `${((resumen.totales.conPerifericos / (resumen.totales.total || 1)) * 100).toFixed(1)}%`],
      ['Con Coordenadas GPS', resumen.totales.conCoordenadas, `${((resumen.totales.conCoordenadas / (resumen.totales.total || 1)) * 100).toFixed(1)}%`],
    ];

    kpiRows.forEach((rData, i) => {
      const r = wsResumen.getRow(4 + i);
      r.getCell(1).value = rData[0];
      r.getCell(2).value = rData[1];
      r.getCell(3).value = rData[2];
      [1, 2, 3].forEach(colIdx => {
        const c = r.getCell(colIdx);
        c.font = { name: 'Segoe UI', size: 9 };
        c.border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }, left: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
        c.alignment = { vertical: 'middle', horizontal: colIdx === 1 ? 'left' : 'center' };
      });
    });

    // Tabla 2: Por Tipo de Comunicación
    let currRow = 4 + kpiRows.length + 2;
    wsResumen.getCell(`A${currRow}`).value = 'TIPO DE COMUNICACIÓN / RED';
    wsResumen.getCell(`B${currRow}`).value = 'CANTIDAD';
    wsResumen.getCell(`C${currRow}`).value = '% TOTAL';
    wsResumen.getCell(`D${currRow}`).value = 'ACTIVOS';
    wsResumen.getCell(`E${currRow}`).value = 'INACTIVOS';
    ['A', 'B', 'C', 'D', 'E'].forEach(col => {
      const c = wsResumen.getCell(`${col}${currRow}`);
      c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorPrimary } };
      c.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    resumen.porTipoComunicacion.forEach((tc) => {
      currRow++;
      const r = wsResumen.getRow(currRow);
      r.getCell(1).value = tc.nombre;
      r.getCell(2).value = tc.cantidad;
      r.getCell(3).value = `${tc.porcentaje}%`;
      r.getCell(4).value = tc.activos;
      r.getCell(5).value = tc.inactivos;
      [1, 2, 3, 4, 5].forEach(colIdx => {
        const c = r.getCell(colIdx);
        c.font = { name: 'Segoe UI', size: 9 };
        c.border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }, left: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
        c.alignment = { vertical: 'middle', horizontal: colIdx === 1 ? 'left' : 'center' };
      });
    });

    // Tabla 3: Por Administrador
    currRow += 2;
    wsResumen.getCell(`A${currRow}`).value = 'ADMINISTRADOR';
    wsResumen.getCell(`B${currRow}`).value = 'CANTIDAD';
    wsResumen.getCell(`C${currRow}`).value = '% TOTAL';
    wsResumen.getCell(`D${currRow}`).value = 'ACTIVOS';
    wsResumen.getCell(`E${currRow}`).value = 'INACTIVOS';
    ['A', 'B', 'C', 'D', 'E'].forEach(col => {
      const c = wsResumen.getCell(`${col}${currRow}`);
      c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorDark } };
      c.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    resumen.porAdministrador.forEach((adm) => {
      currRow++;
      const r = wsResumen.getRow(currRow);
      r.getCell(1).value = adm.nombre;
      r.getCell(2).value = adm.cantidad;
      r.getCell(3).value = `${adm.porcentaje}%`;
      r.getCell(4).value = adm.activos;
      r.getCell(5).value = adm.inactivos;
      [1, 2, 3, 4, 5].forEach(colIdx => {
        const c = r.getCell(colIdx);
        c.font = { name: 'Segoe UI', size: 9 };
        c.border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }, left: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
        c.alignment = { vertical: 'middle', horizontal: colIdx === 1 ? 'left' : 'center' };
      });
    });

    // Tabla 4: Top Distritos
    currRow += 2;
    wsResumen.getCell(`A${currRow}`).value = 'DISTRITO';
    wsResumen.getCell(`B${currRow}`).value = 'CANTIDAD';
    wsResumen.getCell(`C${currRow}`).value = '% COBERTURA';
    wsResumen.getCell(`D${currRow}`).value = 'ACTIVOS';
    wsResumen.getCell(`E${currRow}`).value = 'INACTIVOS';
    ['A', 'B', 'C', 'D', 'E'].forEach(col => {
      const c = wsResumen.getCell(`${col}${currRow}`);
      c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorPrimary } };
      c.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    resumen.porDistrito.slice(0, 25).forEach((dis) => {
      currRow++;
      const r = wsResumen.getRow(currRow);
      r.getCell(1).value = dis.distrito;
      r.getCell(2).value = dis.cantidad;
      r.getCell(3).value = `${dis.porcentaje}%`;
      r.getCell(4).value = dis.activos;
      r.getCell(5).value = dis.inactivos;
      [1, 2, 3, 4, 5].forEach(colIdx => {
        const c = r.getCell(colIdx);
        c.font = { name: 'Segoe UI', size: 9 };
        c.border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }, left: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
        c.alignment = { vertical: 'middle', horizontal: colIdx === 1 ? 'left' : 'center' };
      });
    });

    wsResumen.getColumn(1).width = 35;
    wsResumen.getColumn(2).width = 16;
    wsResumen.getColumn(3).width = 16;
    wsResumen.getColumn(4).width = 14;
    wsResumen.getColumn(5).width = 14;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async findOne(id: number) {
    const cruce = await this.prisma.cruce.findUnique({
      where: { id },
      include: {
        ubigeo: true,
        proyecto: true,
        administrador: true,
        crucesPerifericos: {
          include: {
            periferico: true,
          },
        },
      },
    });

    if (!cruce) {
      throw new NotFoundException(`Cruce con ID ${id} no encontrado`);
    }

    return cruce;
  }

  async update(id: number, updateCruceDto: UpdateCruceDto) {
    await this.findOne(id); // Verificar que existe

    const { ubigeoId, proyectoId, administradorId, via1, via2, ...resto } = updateCruceDto;
    
    const data: any = {
      ...resto,
      updatedAt: new Date(),
    };

    // Manejar relaciones obligatorias
    if (ubigeoId !== undefined) {
      data.ubigeo = { connect: { id: ubigeoId } };
    }
    
    if (proyectoId !== undefined) {
      data.proyecto = { connect: { id: proyectoId } };
    }
    
    // Manejar relaciones opcionales
    if (administradorId !== undefined) {
      if (administradorId === null) {
        data.administrador = { disconnect: true };
      } else {
        data.administrador = { connect: { id: Number(administradorId) } };
      }
    }
    
    if (via1 !== undefined) {
      data.via1 = via1 === null ? null : Number(via1);
    }
    
    if (via2 !== undefined) {
      data.via2 = via2 === null ? null : Number(via2);
    }

    // Actualizar el cruce
    const updatedCruce = await this.prisma.cruce.update({
      where: { id },
      data,
      include: {
        ubigeo: true,
        proyecto: true,
        administrador: true,
        crucesPerifericos: {
          include: {
            periferico: true,
          },
        },
      },
    });

    return updatedCruce;
  }

  async remove(id: number) {
    await this.findOne(id); // Verificar que existe

    return this.prisma.cruce.update({
      where: { id },
      data: {
        estado: false,
        updatedAt: new Date(),
      },
    });
  }

  // Gestión de periféricos
  async addPeriferico(cruceId: number, perifericoId: number) {
    await this.findOne(cruceId);

    // Verificar que el periférico existe
    const periferico = await this.prisma.periferico.findUnique({
      where: { id: perifericoId },
    });

    if (!periferico) {
      throw new NotFoundException(`Periférico con ID ${perifericoId} no encontrado`);
    }

    // Verificar si ya existe la relación
    const existing = await this.prisma.crucePeriferico.findFirst({
      where: {
        cruceId,
        perifericoId,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.crucePeriferico.create({
      data: {
        cruceId,
        perifericoId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        periferico: true,
      },
    });
  }

  async removePeriferico(cruceId: number, perifericoId: number) {
    const relation = await this.prisma.crucePeriferico.findFirst({
      where: {
        cruceId,
        perifericoId,
      },
    });

    if (!relation) {
      throw new NotFoundException(`Relación no encontrada`);
    }

    return this.prisma.crucePeriferico.delete({
      where: { id: relation.id },
    });
  }

  async getPerifericos(cruceId: number) {
    await this.findOne(cruceId);

    return this.prisma.crucePeriferico.findMany({
      where: { cruceId },
      include: {
        periferico: true,
      },
    });
  }

  // Búsqueda para autocomplete
  async search(query: string, limit: number = 20) {
    return this.prisma.cruce.findMany({
      where: {
        OR: [
          {
            nombre: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            codigo: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
        estado: true,
      },
      take: limit,
      select: {
        id: true,
        nombre: true,
        codigo: true,
        latitud: true,
        longitud: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }
}
