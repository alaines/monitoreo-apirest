import { useState, useEffect } from 'react';
import Select from 'react-select';
import { customSelectStylesSmall } from '../../styles/react-select-custom';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { reportesService, PeriodoReporte, FiltrosReporte, EstadisticasReporte } from '../../services/reportes.service';
import { incidentsService } from '../../services/incidents.service';
import { administradoresService, Administrador } from '../../services/administradores.service';
import { PageHeader } from '../../components/ui/PageHeader';

export function ReporteIncidencias() {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [estadisticas, setEstadisticas] = useState<EstadisticasReporte | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  
  // Catálogos
  const [tiposIncidencia, setTiposIncidencia] = useState<any[]>([]);
  const [tiposEstado, setTiposEstado] = useState<any[]>([]);
  const [administradores, setAdministradores] = useState<Administrador[]>([]);
  
  // Filtros
  const [periodo, setPeriodo] = useState<PeriodoReporte>(PeriodoReporte.MES);
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [tipoIncidencia, setTipoIncidencia] = useState<number | undefined>(undefined);
  const [estadoId, setEstadoId] = useState<number | undefined>(undefined);
  const [administradorId, setAdministradorId] = useState<number | undefined>(undefined);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    cargarReporte();
  }, [periodo, mes, anio, fechaInicio, fechaFin, tipoIncidencia, estadoId, administradorId]);

  const cargarCatalogos = async () => {
    try {
      const [tiposIncRes, estadosRes, adminRes] = await Promise.all([
        incidentsService.getTiposIncidencias(),
        incidentsService.getEstadosIncidencia(),
        administradoresService.getAll(),
      ]);
      setTiposIncidencia(tiposIncRes || []);
      setTiposEstado(estadosRes || []);
      setAdministradores(adminRes || []);
    } catch (error) {
      console.error('Error loading catalogs:', error);
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

      const doc = new jsPDF();
      
      // Encabezado
      doc.setFontSize(18);
      doc.text('Sistema de Monitoreo de Semáforos', 105, 15, { align: 'center' });
      doc.setFontSize(14);
      doc.text('Reporte de Incidencias', 105, 24, { align: 'center' });
      
      // Información del periodo
      doc.setFontSize(10);
      let periodoTexto = '';
      if (periodo === PeriodoReporte.MES) {
        const nombreMes = meses.find(m => m.value === mes)?.label || '';
        periodoTexto = `Periodo: ${nombreMes} ${anio}`;
      } else if (periodo === PeriodoReporte.ANIO) {
        periodoTexto = `Periodo: Año ${anio}`;
      } else if (periodo === PeriodoReporte.DIA) {
        periodoTexto = `Periodo: Hoy`;
      } else if (periodo === PeriodoReporte.PERSONALIZADO && fechaInicio && fechaFin) {
        periodoTexto = `Periodo: ${fechaInicio} a ${fechaFin}`;
      }
      
      doc.text(periodoTexto, 105, 32, { align: 'center' });
      doc.text(`Total de incidencias: ${estadisticas.total}`, 105, 38, { align: 'center' });
      doc.text(`Fecha de generación: ${new Date().toLocaleString('es-PE')}`, 105, 44, { align: 'center' });
      
      doc.setLineWidth(0.5);
      doc.line(10, 48, 200, 48);
      
      let y = 54;
      
      // Resumen por Tipo
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen por Tipo de Incidencia', 14, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
      
      autoTable(doc, {
        startY: y,
        head: [['Tipo', 'Cantidad', 'Porcentaje']],
        body: estadisticas.porTipo.map(item => [
          item.tipo,
          item.cantidad.toString(),
          `${item.porcentaje}%`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 9, cellPadding: 2 },
      });
      
      y = (doc as any).lastAutoTable.finalY + 10;
      
      // Resumen por Estado
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen por Estado', 14, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
      
      autoTable(doc, {
        startY: y,
        head: [['Estado', 'Cantidad', 'Porcentaje']],
        body: estadisticas.porEstado.map(item => [
          item.estado,
          item.cantidad.toString(),
          `${item.porcentaje}%`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 9, cellPadding: 2 },
      });
      
      y = (doc as any).lastAutoTable.finalY + 10;
      
      // Si hay espacio, agregar por administrador, si no, nueva página
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      
      // Resumen por Administrador
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen por Administrador', 14, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
      
      autoTable(doc, {
        startY: y,
        head: [['Administrador', 'Cantidad']],
        body: estadisticas.porAdministrador.map(item => [
          item.administrador,
          item.cantidad.toString()
        ]),
        theme: 'grid',
        headStyles: { fillColor: [39, 174, 96] },
        styles: { fontSize: 9, cellPadding: 2 },
      });
      
      y = (doc as any).lastAutoTable.finalY + 10;
      
      // Si hay datos por mes, agregarlos
      if (estadisticas.porMes.length > 0) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumen por Mes', 14, y);
        doc.setFont('helvetica', 'normal');
        y += 6;
        
        autoTable(doc, {
          startY: y,
          head: [['Mes', 'Cantidad']],
          body: estadisticas.porMes.map(item => [
            item.mes,
            item.cantidad.toString()
          ]),
          theme: 'grid',
          headStyles: { fillColor: [243, 156, 18] },
          styles: { fontSize: 9, cellPadding: 2 },
        });
      }
      
      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(`Página ${i} de ${pageCount}`, 200 - 20, 290, { align: 'right' });
      }
      
      doc.save(`reporte_incidencias_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF descargado exitosamente');
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
            {/* Primera fila: Periodo */}
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
            </div>

            {/* Segunda fila: Filtros adicionales */}
            <div className="row g-2">
              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted mb-1">Tipo de Incidencia</label>
                <Select
                  options={[
                    { value: undefined, label: 'Todos' },
                    ...tiposIncidencia.map(tipo => ({ value: tipo.id, label: tipo.tipo }))
                  ]}
                  value={tipoIncidencia ? tiposIncidencia.find(t => t.id === tipoIncidencia) ? { value: tipoIncidencia, label: tiposIncidencia.find(t => t.id === tipoIncidencia)?.tipo || '' } : { value: undefined, label: 'Todos' } : { value: undefined, label: 'Todos' }}
                  onChange={(option) => setTipoIncidencia(option?.value)}
                  isClearable
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
