import { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { customSelectStylesSmall } from '../../styles/react-select-custom';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { reportesService, PeriodoReporte, FiltrosReporte, EstadisticasReporte } from '../../services/reportes.service';
import { incidentsService, IncidenciaCatalog, EstadoCatalog } from '../../services/incidents.service';
import { administradoresService, Administrador } from '../../services/administradores.service';
import { PageHeader } from '../../components/ui/PageHeader';
import { drawPdfHeader, applyPdfFooters, drawPdfMetadata, drawPdfKpiCards, getPdfTableStyles, PDF_COLORS } from '../../utils/pdfReportHelper';

export function ReporteIncidencias() {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [estadisticas, setEstadisticas] = useState<EstadisticasReporte | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  
  // Catálogos
  const [tiposIncidencia, setTiposIncidencia] = useState<IncidenciaCatalog[]>([]);
  const [tiposEstado, setTiposEstado] = useState<EstadoCatalog[]>([]);
  const [administradores, setAdministradores] = useState<Administrador[]>([]);
  
  // Filtros
  const [periodo, setPeriodo] = useState<PeriodoReporte>(PeriodoReporte.MES);
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [caracteristica, setCaracteristica] = useState<string>('I');
  const [tipoIncidencia, setTipoIncidencia] = useState<number | undefined>(undefined);
  const [estadoId, setEstadoId] = useState<number | undefined>(undefined);
  const [administradorId, setAdministradorId] = useState<number | undefined>(undefined);

  const opcionesCaracteristica = [
    { value: 'I', label: 'Incidencias / Averías (I)' },
    { value: 'T', label: 'Trabajos Programados (T)' },
    { value: '', label: 'Todos (I + T)' },
  ];

  // Filtrar tipos de incidencia según la característica seleccionada
  const tiposFiltrados = useMemo(() => {
    if (!caracteristica) return tiposIncidencia;
    if (caracteristica === 'I') {
      return tiposIncidencia.filter(t => !t.caracteristica || t.caracteristica === 'I');
    }
    if (caracteristica === 'T') {
      return tiposIncidencia.filter(t => t.caracteristica === 'T');
    }
    return tiposIncidencia;
  }, [tiposIncidencia, caracteristica]);

  const handleCaracteristicaChange = (nuevaCaracteristica: string) => {
    setCaracteristica(nuevaCaracteristica);
    if (tipoIncidencia) {
      const sigueExistiendo = tiposIncidencia.some(t => {
        if (t.id !== tipoIncidencia) return false;
        if (!nuevaCaracteristica) return true;
        if (nuevaCaracteristica === 'I') return !t.caracteristica || t.caracteristica === 'I';
        if (nuevaCaracteristica === 'T') return t.caracteristica === 'T';
        return true;
      });
      if (!sigueExistiendo) {
        setTipoIncidencia(undefined);
      }
    }
  };

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    cargarReporte();
  }, [periodo, mes, anio, fechaInicio, fechaFin, caracteristica, tipoIncidencia, estadoId, administradorId]);

  const cargarCatalogos = async () => {
    try {
      const [tiposIncRes, estadosRes, adminRes] = await Promise.all([
        incidentsService.getIncidenciasCatalog(),
        incidentsService.getEstadosCatalog(),
        administradoresService.getAdministradores(),
      ]);
      setTiposIncidencia(tiposIncRes || []);
      setTiposEstado(estadosRes || []);
      setAdministradores(adminRes || []);
    } catch (error) {
      console.error('Error loading catalogs:', error);
      toast.error('Error al cargar catálogos de filtros');
    }
  };

  const cargarReporte = async () => {
    try {
      setLoading(true);
      const filtros = buildFiltros();
      const data = await reportesService.getEstadisticas(filtros);
      setEstadisticas(data);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildFiltros = (): FiltrosReporte => {
    const filtros: FiltrosReporte = {
      periodo,
    };

    if (periodo === PeriodoReporte.PERSONALIZADO) {
      if (fechaInicio) filtros.fechaInicio = fechaInicio;
      if (fechaFin) filtros.fechaFin = fechaFin;
    } else if (periodo === PeriodoReporte.MES) {
      filtros.mes = mes;
      filtros.anio = anio;
    } else if (periodo === PeriodoReporte.ANIO) {
      filtros.anio = anio;
    } else if (periodo === PeriodoReporte.DIA) {
      filtros.dia = new Date().getDate();
      filtros.mes = new Date().getMonth() + 1;
      filtros.anio = new Date().getFullYear();
    }

    if (caracteristica) filtros.caracteristica = caracteristica;
    if (tipoIncidencia) filtros.tipoIncidencia = tipoIncidencia;
    if (estadoId) filtros.estadoId = estadoId;
    if (administradorId) filtros.administradorId = administradorId;

    return filtros;
  };

  const handleExportarExcel = async () => {
    try {
      setExporting(true);
      const filtros = buildFiltros();
      await reportesService.exportarExcel(filtros);
      toast.success('Excel descargado exitosamente');
    } catch (error: any) {
      console.error('Error exporting to Excel:', error);
      toast.error(`Error al exportar a Excel: ${error.response?.data?.message || error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportarPDF = async () => {
    try {
      setExporting(true);
      
      if (!estadisticas) {
        toast.error('No hay datos para exportar');
        return;
      }

      const doc = new jsPDF('p', 'mm', 'a4');
      const tableStyles = getPdfTableStyles();
      
      // Información del periodo
      let periodoTexto = '';
      if (periodo === PeriodoReporte.MES) {
        const nombreMes = meses.find(m => m.value === mes)?.label || '';
        periodoTexto = `${nombreMes} ${anio}`;
      } else if (periodo === PeriodoReporte.ANIO) {
        periodoTexto = `Año ${anio}`;
      } else if (periodo === PeriodoReporte.DIA) {
        periodoTexto = `Hoy (${new Date().toLocaleDateString('es-PE')})`;
      } else if (periodo === PeriodoReporte.PERSONALIZADO && fechaInicio && fechaFin) {
        periodoTexto = `${fechaInicio} a ${fechaFin}`;
      }

      // Encabezado institucional de la Página 1
      let y = drawPdfHeader(doc, true, 'Reporte de Gestión de Incidencias y Averías');

      // Metadatos
      const metaItems = [
        { label: 'Período de Análisis', value: periodoTexto },
        { label: 'Fecha de Emisión', value: new Date().toLocaleString('es-PE') },
      ];
      if (caracteristica) {
        metaItems.push({
          label: 'Característica',
          value: caracteristica === 'I' ? 'Incidencias / Averías (I)' : caracteristica === 'T' ? 'Trabajos Programados (T)' : 'Todas (I + T)',
        });
      }
      if (tipoIncidencia) {
        const tipo = tiposIncidencia.find(t => t.id === tipoIncidencia);
        if (tipo) metaItems.push({ label: 'Tipo de Incidencia', value: tipo.tipo });
      }
      if (estadoId) {
        const est = tiposEstado.find(e => e.id === estadoId);
        if (est) metaItems.push({ label: 'Estado', value: est.nombre });
      }
      if (administradorId) {
        const adm = administradores.find(a => a.id === administradorId);
        if (adm) metaItems.push({ label: 'Administrador', value: adm.nombre });
      }

      y = drawPdfMetadata(doc, y, metaItems);

      // Cajas de KPIs
      const kpis = [
        { label: 'TOTAL INCIDENCIAS', value: (estadisticas.total || 0).toLocaleString(), sub: '100% registros', color: PDF_COLORS.primary },
        { label: 'TIPOS DISTINTOS', value: (estadisticas.porTipo?.length || 0).toString(), sub: 'Tipologías atendidas', color: PDF_COLORS.secondary },
        { label: 'ESTADOS DE GESTIÓN', value: (estadisticas.porEstado?.length || 0).toString(), sub: 'Flujo de atención', color: PDF_COLORS.warning },
        { label: 'ADMINISTRADORES', value: (estadisticas.porAdministrador?.length || 0).toString(), sub: 'Contratistas / Zonas', color: PDF_COLORS.success },
      ];

      y = drawPdfKpiCards(doc, y, kpis);

      // 1. Resumen por Tipo de Incidencia
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
      doc.text('1. Distribución por Tipo de Incidencia y Avería', 14, y);
      y += 3;
      
      autoTable(doc, {
        ...tableStyles,
        startY: y,
        head: [['N°', 'Tipo de Incidencia / Avería', 'Cantidad', '% del Total']],
        body: (estadisticas.porTipo || []).map((item, idx) => [
          (idx + 1).toString(),
          item.tipo,
          item.cantidad.toLocaleString(),
          `${item.porcentaje}%`
        ]),
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { halign: 'left' },
          2: { cellWidth: 26, halign: 'center' },
          3: { cellWidth: 26, halign: 'center' },
        },
      });
      
      y = (doc as any).lastAutoTable.finalY + 8;
      
      // 2. Resumen por Estado
      if (y > 230) {
        doc.addPage();
        y = drawPdfHeader(doc, false, 'Reporte de Gestión de Incidencias', `Período: ${periodoTexto}`);
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
      doc.text('2. Distribución por Estado de Incidencias', 14, y);
      y += 3;
      
      autoTable(doc, {
        ...tableStyles,
        startY: y,
        head: [['N°', 'Estado de la Incidencia', 'Cantidad', '% del Total']],
        body: (estadisticas.porEstado || []).map((item, idx) => [
          (idx + 1).toString(),
          item.estado,
          item.cantidad.toLocaleString(),
          `${item.porcentaje}%`
        ]),
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { halign: 'left' },
          2: { cellWidth: 26, halign: 'center' },
          3: { cellWidth: 26, halign: 'center' },
        },
      });
      
      y = (doc as any).lastAutoTable.finalY + 8;
      
      // 3. Resumen por Administrador
      if (estadisticas.porAdministrador && estadisticas.porAdministrador.length > 0) {
        if (y > 230) {
          doc.addPage();
          y = drawPdfHeader(doc, false, 'Reporte de Gestión de Incidencias', `Período: ${periodoTexto}`);
        }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
        doc.text('3. Desglose por Administrador / Contratista', 14, y);
        y += 3;
        
        const totalAdmin = estadisticas.porAdministrador.reduce((acc, it) => acc + it.cantidad, 0);
        autoTable(doc, {
          ...tableStyles,
          startY: y,
          head: [['N°', 'Administrador / Entidad a Cargo', 'Cantidad de Incidencias', '% Participación']],
          body: estadisticas.porAdministrador.map((item, idx) => [
            (idx + 1).toString(),
            item.administrador,
            item.cantidad.toLocaleString(),
            totalAdmin > 0 ? `${((item.cantidad / totalAdmin) * 100).toFixed(1)}%` : '0%'
          ]),
          columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { halign: 'left' },
            2: { cellWidth: 38, halign: 'center' },
            3: { cellWidth: 32, halign: 'center' },
          },
        });

        y = (doc as any).lastAutoTable.finalY + 8;
      }
      
      // 4. Resumen por Mes (si existe)
      if (estadisticas.porMes && estadisticas.porMes.length > 0) {
        if (y > 230) {
          doc.addPage();
          y = drawPdfHeader(doc, false, 'Reporte de Gestión de Incidencias', `Período: ${periodoTexto}`);
        }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
        doc.text('4. Evolución Mensual de Incidencias', 14, y);
        y += 3;
        
        const totalMes = estadisticas.porMes.reduce((acc, it) => acc + it.cantidad, 0);
        autoTable(doc, {
          ...tableStyles,
          startY: y,
          head: [['N°', 'Mes / Período', 'Cantidad de Incidencias', '% del Total']],
          body: estadisticas.porMes.map((item, idx) => [
            (idx + 1).toString(),
            item.mes,
            item.cantidad.toLocaleString(),
            totalMes > 0 ? `${((item.cantidad / totalMes) * 100).toFixed(1)}%` : '0%'
          ]),
          columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { halign: 'left' },
            2: { cellWidth: 38, halign: 'center' },
            3: { cellWidth: 32, halign: 'center' },
          },
        });
      }
      
      // Footer institucional en todas las páginas
      applyPdfFooters(doc);
      
      const fecha = new Date().toISOString().split('T')[0];
      doc.save(`reporte_incidencias_${fecha}.pdf`);
      toast.success('Reporte PDF descargado exitosamente');
    } catch (error: any) {
      console.error('Error exporting to PDF:', error);
      toast.error(`Error al exportar a PDF: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setPeriodo(PeriodoReporte.MES);
    setMes(new Date().getMonth() + 1);
    setAnio(new Date().getFullYear());
    setFechaInicio('');
    setFechaFin('');
    setCaracteristica('I');
    setTipoIncidencia(undefined);
    setEstadoId(undefined);
    setAdministradorId(undefined);
  };

  const meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  const anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="container-fluid p-3">
      {/* Header */}
      <PageHeader
        icon="fa-solid fa-chart-column"
        title="Reporte de Incidencias"
        subtitle="Análisis estadístico, métricas consolidadas y exportación de datos técnicos"
        actions={
          <div className="d-flex gap-2">
            <button 
              className={`btn btn-sm ${showFilters ? 'btn-secondary' : 'btn-outline-secondary'}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <i className="fa-solid fa-filter me-1"></i>
              {showFilters ? 'Ocultar Filtros' : 'Filtros'}
            </button>
            <button
              className="btn btn-sm btn-success"
              onClick={handleExportarExcel}
              disabled={exporting || loading}
            >
              <i className="fa-solid fa-file-excel me-1"></i>
              {exporting ? 'Exportando...' : 'Excel'}
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={handleExportarPDF}
              disabled={exporting || loading}
            >
              <i className="fa-solid fa-file-pdf me-1"></i>
              {exporting ? 'Exportando...' : 'PDF'}
            </button>
          </div>
        }
      />

      {/* Panel de Filtros */}
      {showFilters && (
        <div className="card border shadow-sm mb-3">
          <div className="card-header bg-white border-bottom py-2">
            <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '14px' }}>
              <i className="fa-solid fa-sliders me-2 text-primary"></i>
              Filtros del Reporte
            </h6>
          </div>
          <div className="card-body py-3">
            {/* Primera fila: Periodo y Característica */}
            <div className="row g-2 mb-2">
              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted mb-1">
                  <i className="fa-solid fa-calendar me-1"></i> Periodo
                </label>
                <Select
                  options={[
                    { value: PeriodoReporte.DIA, label: 'Hoy' },
                    { value: PeriodoReporte.MES, label: 'Mes' },
                    { value: PeriodoReporte.ANIO, label: 'Año' },
                    { value: PeriodoReporte.PERSONALIZADO, label: 'Personalizado' }
                  ]}
                  value={{ value: periodo, label: periodo === PeriodoReporte.DIA ? 'Hoy' : periodo === PeriodoReporte.MES ? 'Mes' : periodo === PeriodoReporte.ANIO ? 'Año' : 'Personalizado' }}
                  onChange={(option) => setPeriodo(option?.value as PeriodoReporte || PeriodoReporte.MES)}
                  styles={customSelectStylesSmall}
                />
              </div>

              {periodo === PeriodoReporte.MES && (
                <>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-muted mb-1">Mes</label>
                    <Select
                      options={meses.map(m => ({ value: m.value, label: m.label }))}
                      value={meses.find(m => m.value === mes)}
                      onChange={(option) => setMes(option?.value || new Date().getMonth() + 1)}
                      styles={customSelectStylesSmall}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-muted mb-1">Año</label>
                    <Select
                      options={anios.map(a => ({ value: a, label: a.toString() }))}
                      value={{ value: anio, label: anio.toString() }}
                      onChange={(option) => setAnio(option?.value || new Date().getFullYear())}
                      styles={customSelectStylesSmall}
                    />
                  </div>
                </>
              )}

              {periodo === PeriodoReporte.ANIO && (
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted mb-1">Año</label>
                  <Select
                    options={anios.map(a => ({ value: a, label: a.toString() }))}
                    value={{ value: anio, label: anio.toString() }}
                    onChange={(option) => setAnio(option?.value || new Date().getFullYear())}
                    styles={customSelectStylesSmall}
                  />
                </div>
              )}

              {periodo === PeriodoReporte.PERSONALIZADO && (
                <>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-muted mb-1">Fecha Inicio</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-muted mb-1">Fecha Fin</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted mb-1">
                  <i className="fa-solid fa-tag me-1"></i> Característica
                </label>
                <Select
                  options={opcionesCaracteristica}
                  value={opcionesCaracteristica.find(o => o.value === caracteristica) || opcionesCaracteristica[0]}
                  onChange={(option) => handleCaracteristicaChange(option?.value ?? '')}
                  styles={customSelectStylesSmall}
                />
              </div>
            </div>

            {/* Segunda fila: Tipo, Estado, Administrador y Limpiar */}
            <div className="row g-2">
              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted mb-1">Tipo de Incidencia</label>
                <Select
                  options={[
                    { value: undefined, label: 'Todos' },
                    ...tiposFiltrados.map(tipo => ({ value: tipo.id, label: tipo.tipo }))
                  ]}
                  value={tipoIncidencia ? tiposFiltrados.find(t => t.id === tipoIncidencia) ? { value: tipoIncidencia, label: tiposFiltrados.find(t => t.id === tipoIncidencia)?.tipo || '' } : { value: undefined, label: 'Todos' } : { value: undefined, label: 'Todos' }}
                  onChange={(option) => setTipoIncidencia(option?.value)}
                  isClearable
                  placeholder="Todos"
                  styles={customSelectStylesSmall}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted mb-1">Estado</label>
                <Select
                  options={[
                    { value: undefined, label: 'Todos' },
                    ...tiposEstado.map(estado => ({ value: estado.id, label: estado.nombre }))
                  ]}
                  value={estadoId ? tiposEstado.find(e => e.id === estadoId) ? { value: estadoId, label: tiposEstado.find(e => e.id === estadoId)?.nombre || '' } : { value: undefined, label: 'Todos' } : { value: undefined, label: 'Todos' }}
                  onChange={(option) => setEstadoId(option?.value)}
                  isClearable
                  placeholder="Todos"
                  styles={customSelectStylesSmall}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted mb-1">Administrador</label>
                <Select
                  options={[
                    { value: undefined, label: 'Todos' },
                    ...administradores.map(admin => ({ value: admin.id, label: admin.nombre }))
                  ]}
                  value={administradorId ? administradores.find(a => a.id === administradorId) ? { value: administradorId, label: administradores.find(a => a.id === administradorId)?.nombre || '' } : { value: undefined, label: 'Todos' } : { value: undefined, label: 'Todos' }}
                  onChange={(option) => setAdministradorId(option?.value)}
                  isClearable
                  placeholder="Todos"
                  styles={customSelectStylesSmall}
                />
              </div>

              <div className="col-md-3 d-flex align-items-end">
                <button
                  className="btn btn-sm btn-outline-secondary w-100"
                  onClick={clearFilters}
                  title="Limpiar filtros"
                >
                  <i className="fa-solid fa-eraser me-1"></i> Limpiar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : estadisticas ? (
        estadisticas.total === 0 ? (
          <div className="card border shadow-sm p-5 text-center text-muted">
            <i className="fa-solid fa-chart-pie fa-3x mb-3 text-secondary"></i>
            <h6 className="fw-semibold">No se encontraron incidencias</h6>
            <p className="small mb-0">No hay registros que coincidan con los filtros seleccionados en este período.</p>
          </div>
        ) : (
          <>
            {/* Tarjetas de Métricas / KPIs */}
            <div className="row g-3 mb-3">
              <div className="col-xl-3 col-md-6">
                <div className="card card-widget mb-0 h-100 border shadow-sm">
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="widget-subheading text-uppercase text-muted fw-bold">TOTAL INCIDENCIAS</div>
                      <div className="widget-icon-box text-primary" style={{ width: '36px', height: '36px' }}>
                        <i className="fa-solid fa-triangle-exclamation"></i>
                      </div>
                    </div>
                    <div className="widget-numbers text-primary mb-1">
                      {estadisticas.total}
                    </div>
                    <small className="text-muted d-block" style={{ fontSize: '11px' }}>Registros totales del periodo</small>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6">
                <div className="card card-widget mb-0 h-100 border shadow-sm">
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="widget-subheading text-uppercase text-muted fw-bold">TIPOS REGISTRADOS</div>
                      <div className="widget-icon-box text-success" style={{ width: '36px', height: '36px' }}>
                        <i className="fa-solid fa-tags"></i>
                      </div>
                    </div>
                    <div className="widget-numbers text-success mb-1">
                      {estadisticas.porTipo.length}
                    </div>
                    <small className="text-muted d-block" style={{ fontSize: '11px' }}>Categorías registradas</small>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6">
                <div className="card card-widget mb-0 h-100 border shadow-sm">
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="widget-subheading text-uppercase text-muted fw-bold">ESTADOS ACTIVOS</div>
                      <div className="widget-icon-box text-warning" style={{ width: '36px', height: '36px' }}>
                        <i className="fa-solid fa-list-check"></i>
                      </div>
                    </div>
                    <div className="widget-numbers text-warning mb-1">
                      {estadisticas.porEstado.length}
                    </div>
                    <small className="text-muted d-block" style={{ fontSize: '11px' }}>Estados en el periodo</small>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6">
                <div className="card card-widget mb-0 h-100 border shadow-sm">
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="widget-subheading text-uppercase text-muted fw-bold">ADMINISTRADORES</div>
                      <div className="widget-icon-box text-info" style={{ width: '36px', height: '36px' }}>
                        <i className="fa-solid fa-user-shield"></i>
                      </div>
                    </div>
                    <div className="widget-numbers text-info mb-1">
                      {estadisticas.porAdministrador.length}
                    </div>
                    <small className="text-muted d-block" style={{ fontSize: '11px' }}>Contratistas / Administradores</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Tablas de resumen */}
            <div className="row g-3">
              {/* Por Tipo */}
              <div className="col-md-6">
                <div className="card border shadow-sm mb-3">
                  <div className="card-header bg-white border-bottom py-2">
                    <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '14px' }}>
                      <i className="fa-solid fa-chart-pie me-2 text-primary"></i>
                      Por Tipo de Incidencia
                    </h6>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover table-striped align-middle mb-0" style={{ fontSize: '13px' }}>
                        <thead className="table-light text-uppercase" style={{ fontSize: '12px' }}>
                          <tr>
                            <th className="px-3 py-2">Tipo</th>
                            <th className="py-2 text-end">Cantidad</th>
                            <th className="py-2 text-end px-3">Porcentaje</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estadisticas.porTipo.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-3 fw-semibold">{item.tipo}</td>
                              <td className="text-end">{item.cantidad}</td>
                              <td className="text-end px-3">
                                <span className="badge bg-primary">{item.porcentaje}%</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Por Estado */}
              <div className="col-md-6">
                <div className="card border shadow-sm mb-3">
                  <div className="card-header bg-white border-bottom py-2">
                    <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '14px' }}>
                      <i className="fa-solid fa-list-check me-2 text-success"></i>
                      Por Estado
                    </h6>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover table-striped align-middle mb-0" style={{ fontSize: '13px' }}>
                        <thead className="table-light text-uppercase" style={{ fontSize: '12px' }}>
                          <tr>
                            <th className="px-3 py-2">Estado</th>
                            <th className="py-2 text-end">Cantidad</th>
                            <th className="py-2 text-end px-3">Porcentaje</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estadisticas.porEstado.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-3 fw-semibold">{item.estado}</td>
                              <td className="text-end">{item.cantidad}</td>
                              <td className="text-end px-3">
                                <span className="badge bg-success">{item.porcentaje}%</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Por Administrador */}
              <div className="col-md-6">
                <div className="card border shadow-sm mb-3">
                  <div className="card-header bg-white border-bottom py-2">
                    <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '14px' }}>
                      <i className="fa-solid fa-users me-2 text-info"></i>
                      Por Administrador
                    </h6>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover table-striped align-middle mb-0" style={{ fontSize: '13px' }}>
                        <thead className="table-light text-uppercase" style={{ fontSize: '12px' }}>
                          <tr>
                            <th className="px-3 py-2">Administrador</th>
                            <th className="py-2 text-end px-3">Cantidad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estadisticas.porAdministrador.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-3 fw-semibold">{item.administrador}</td>
                              <td className="text-end px-3">
                                <span className="badge bg-info text-dark">{item.cantidad}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Por Mes */}
              <div className="col-md-6">
                <div className="card border shadow-sm mb-3">
                  <div className="card-header bg-white border-bottom py-2">
                    <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '14px' }}>
                      <i className="fa-solid fa-calendar-days me-2 text-warning"></i>
                      Por Mes
                    </h6>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover table-striped align-middle mb-0" style={{ fontSize: '13px' }}>
                        <thead className="table-light text-uppercase" style={{ fontSize: '12px' }}>
                          <tr>
                            <th className="px-3 py-2">Mes</th>
                            <th className="py-2 text-end px-3">Cantidad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estadisticas.porMes.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-3 fw-semibold">{item.mes}</td>
                              <td className="text-end px-3">
                                <span className="badge bg-warning text-dark">{item.cantidad}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      ) : null}
    </div>
  );
}
