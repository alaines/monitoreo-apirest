import { useState, useEffect } from 'react';
import { reportesService, PeriodoReporte, FiltrosReporte, EstadisticasReporte } from '../../services/reportes.service';
import { tiposService, Tipo } from '../../services/tipos.service';
import { administradoresService, Administrador } from '../../services/administradores.service';

export function ReporteIncidencias() {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [estadisticas, setEstadisticas] = useState<EstadisticasReporte | null>(null);
  const [incidencias, setIncidencias] = useState<any[]>([]);
  
  // Catálogos
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [administradores, setAdministradores] = useState<Administrador[]>([]);
  
  // Filtros
  const [periodo, setPeriodo] = useState<PeriodoReporte>(PeriodoReporte.MES);
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [tipoIncidencia, setTipoIncidencia] = useState<number | undefined>();
  const [estadoId, setEstadoId] = useState<number | undefined>();
  const [administradorId, setAdministradorId] = useState<number | undefined>();

  useEffect(() => {
    loadCatalogos();
  }, []);

  useEffect(() => {
    if (tipos.length > 0) {
      loadEstadisticas();
    }
  }, [periodo, mes, anio, fechaInicio, fechaFin, tipoIncidencia, estadoId, administradorId, tipos]);

  const loadCatalogos = async () => {
    try {
      const [tiposData, adminsData] = await Promise.all([
        tiposService.getTipos(),
        administradoresService.getAdministradores()
      ]);
      setTipos(tiposData);
      setAdministradores(adminsData);
    } catch (error) {
      console.error('Error loading catalogos:', error);
    }
  };

  const loadEstadisticas = async () => {
    try {
      setLoading(true);
      const filtros = buildFiltros();
      const [dataEstadisticas, dataIncidencias] = await Promise.all([
        reportesService.getEstadisticas(filtros),
        reportesService.getReporteIncidencias(filtros)
      ]);
      setEstadisticas(dataEstadisticas);
      setIncidencias(dataIncidencias);
    } catch (error) {
      console.error('Error loading estadisticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildFiltros = (): FiltrosReporte => {
    const filtros: FiltrosReporte = { periodo };

    if (periodo === PeriodoReporte.PERSONALIZADO) {
      if (fechaInicio) filtros.fechaInicio = fechaInicio;
      if (fechaFin) filtros.fechaFin = fechaFin;
    } else if (periodo === PeriodoReporte.MES) {
      filtros.mes = mes;
      filtros.anio = anio;
    } else if (periodo === PeriodoReporte.ANIO) {
      filtros.anio = anio;
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
      alert('Excel descargado exitosamente');
    } catch (error: any) {
      console.error('Error exporting to Excel:', error);
      alert(`Error al exportar a Excel: ${error.response?.data?.message || error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportarPDF = async () => {
    try {
      setExporting(true);
      const filtros = buildFiltros();
      await reportesService.exportarPDF(filtros);
      alert('PDF descargado exitosamente');
    } catch (error: any) {
      console.error('Error exporting to PDF:', error);
      alert(`Error al exportar a PDF: ${error.response?.data?.message || error.message}`);
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

  const tiposIncidencia = tipos.filter(t => t.parent_id === 5); // INCIDENCIA
  const tiposEstado = tipos.filter(t => t.parent_id === 7); // ESTADO

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
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <h2>
            <i className="fas fa-chart-bar me-2"></i>
            Reporte de Incidencias
          </h2>
          <p className="text-muted">Análisis y exportación de datos de incidencias</p>
        </div>
        <div className="col-auto">
          <button
            className="btn btn-success me-2"
            onClick={handleExportarExcel}
            disabled={exporting || loading}
          >
            <i className="fas fa-file-excel me-2"></i>
            {exporting ? 'Exportando...' : 'Exportar Excel'}
          </button>
          <button
            className="btn btn-danger"
            onClick={handleExportarPDF}
            disabled={exporting || loading}
          >
            <i className="fas fa-file-pdf me-2"></i>
            {exporting ? 'Exportando...' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      {/* Panel de Filtros */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">
            <i className="fas fa-filter me-2"></i>
            Filtros de Reporte
          </h5>
        </div>
        <div className="card-body">
          {/* Primera fila: Periodo */}
          <div className="row g-3 mb-3">
            <div className="col-md-3">
              <label className="form-label fw-bold">
                <i className="fas fa-calendar me-2"></i>
                Periodo
              </label>
              <select
                className="form-select"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value as PeriodoReporte)}
              >
                <option value={PeriodoReporte.DIA}>Hoy</option>
                <option value={PeriodoReporte.MES}>Mes</option>
                <option value={PeriodoReporte.ANIO}>Año</option>
                <option value={PeriodoReporte.PERSONALIZADO}>Personalizado</option>
              </select>
            </div>

            {periodo === PeriodoReporte.MES && (
              <>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Mes</label>
                  <select
                    className="form-select"
                    value={mes}
                    onChange={(e) => setMes(parseInt(e.target.value))}
                  >
                    {meses.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Año</label>
                  <select
                    className="form-select"
                    value={anio}
                    onChange={(e) => setAnio(parseInt(e.target.value))}
                  >
                    {anios.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {periodo === PeriodoReporte.ANIO && (
              <div className="col-md-3">
                <label className="form-label fw-bold">Año</label>
                <select
                  className="form-select"
                  value={anio}
                  onChange={(e) => setAnio(parseInt(e.target.value))}
                >
                  {anios.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            )}

            {periodo === PeriodoReporte.PERSONALIZADO && (
              <>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Fecha Inicio</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Fecha Fin</label>
                  <input
                    type="date"
                    className="form-control"
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
              <label className="form-label fw-bold">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Tipo de Incidencia
              </label>
              <select
                className="form-select"
                value={tipoIncidencia || ''}
                onChange={(e) => setTipoIncidencia(e.target.value ? parseInt(e.target.value) : undefined)}
              >
                <option value="">Todos</option>
                {tiposIncidencia.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>{tipo.name}</option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label fw-bold">
                <i className="fas fa-info-circle me-2"></i>
                Estado
              </label>
              <select
                className="form-select"
                value={estadoId || ''}
                onChange={(e) => setEstadoId(e.target.value ? parseInt(e.target.value) : undefined)}
              >
                <option value="">Todos</option>
                {tiposEstado.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>{tipo.name}</option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-bold">
                <i className="fas fa-user-tie me-2"></i>
                Administrador
              </label>
              <select
                className="form-select"
                value={administradorId || ''}
                onChange={(e) => setAdministradorId(e.target.value ? parseInt(e.target.value) : undefined)}
              >
                <option value="">Todos</option>
                {administradores.map(admin => (
                  <option key={admin.id} value={admin.id}>{admin.nombre}</option>
                ))}
              </select>
            </div>

            <div className="col-md-1 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={clearFilters}
                title="Limpiar filtros"
              >
                <i className="fas fa-eraser"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : estadisticas ? (
        <>
          {/* Tarjeta de totales */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card shadow-sm border-0 bg-primary text-white">
                <div className="card-body">
                  <h6 className="card-subtitle mb-2 opacity-75">Total de Incidencias</h6>
                  <h2 className="card-title mb-0">{estadisticas.total}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0 bg-success text-white">
                <div className="card-body">
                  <h6 className="card-subtitle mb-2 opacity-75">Tipos Diferentes</h6>
                  <h2 className="card-title mb-0">{estadisticas.porTipo.length}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0 bg-warning text-white">
                <div className="card-body">
                  <h6 className="card-subtitle mb-2 opacity-75">Estados Diferentes</h6>
                  <h2 className="card-title mb-0">{estadisticas.porEstado.length}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0 bg-info text-white">
                <div className="card-body">
                  <h6 className="card-subtitle mb-2 opacity-75">Administradores</h6>
                  <h2 className="card-title mb-0">{estadisticas.porAdministrador.length}</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Tablas de resumen */}
          <div className="row g-3">
            {/* Por Tipo */}
            <div className="col-md-6">
              <div className="card shadow-sm">
                <div className="card-header bg-light">
                  <h5 className="mb-0">
                    <i className="fas fa-chart-pie me-2"></i>
                    Por Tipo de Incidencia
                  </h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr>
                          <th>Tipo</th>
                          <th className="text-end">Cantidad</th>
                          <th className="text-end">Porcentaje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estadisticas.porTipo.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.tipo}</td>
                            <td className="text-end">{item.cantidad}</td>
                            <td className="text-end">
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
              <div className="card shadow-sm">
                <div className="card-header bg-light">
                  <h5 className="mb-0">
                    <i className="fas fa-chart-bar me-2"></i>
                    Por Estado
                  </h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr>
                          <th>Estado</th>
                          <th className="text-end">Cantidad</th>
                          <th className="text-end">Porcentaje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estadisticas.porEstado.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.estado}</td>
                            <td className="text-end">{item.cantidad}</td>
                            <td className="text-end">
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
              <div className="card shadow-sm">
                <div className="card-header bg-light">
                  <h5 className="mb-0">
                    <i className="fas fa-users me-2"></i>
                    Por Administrador
                  </h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr>
                          <th>Administrador</th>
                          <th className="text-end">Cantidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estadisticas.porAdministrador.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.administrador}</td>
                            <td className="text-end">
                              <span className="badge bg-info">{item.cantidad}</span>
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
              <div className="card shadow-sm">
                <div className="card-header bg-light">
                  <h5 className="mb-0">
                    <i className="fas fa-calendar-alt me-2"></i>
                    Por Mes
                  </h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr>
                          <th>Mes</th>
                          <th className="text-end">Cantidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estadisticas.porMes.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.mes}</td>
                            <td className="text-end">
                              <span className="badge bg-warning">{item.cantidad}</span>
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

          {/* Listado de Incidencias */}
          <div className="row mt-4">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-header bg-light d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="fas fa-list me-2"></i>
                    Listado de Incidencias ({incidencias.length})
                  </h5>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '60px' }}>Nro</th>
                          <th>Fecha y Hora</th>
                          <th>Incidencia</th>
                          <th>Tipo</th>
                          <th>Cruce</th>
                          <th>Estado</th>
                          <th>Asignado a</th>
                          <th>Tiempo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incidencias.length > 0 ? (
                          incidencias.map((inc, index) => {
                            const fechaReporte = new Date(inc.createdAt);
                            const fechaCierre = inc.updatedAt && inc.estadoId === 3 ? new Date(inc.updatedAt) : null;
                            const ultimoSeguimiento = inc.seguimientos && inc.seguimientos.length > 0 ? inc.seguimientos[0] : null;
                            
                            return (
                              <tr key={inc.id}>
                                <td className="text-center">{index + 1}</td>
                                <td style={{ fontSize: '13px' }}>
                                  {fechaReporte.toLocaleString('es-PE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                                <td>
                                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                                    {inc.incidencia?.tipo || 'Sin tipo'}
                                  </div>
                                  {inc.descripcion && (
                                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                      {inc.descripcion.substring(0, 60)}
                                      {inc.descripcion.length > 60 ? '...' : ''}
                                    </div>
                                  )}
                                </td>
                                <td style={{ fontSize: '13px' }}>
                                  {inc.incidencia?.tipo || 'N/A'}
                                </td>
                                <td style={{ fontSize: '13px' }}>
                                  {inc.cruce ? (
                                    <>
                                      <div>{inc.cruce.codigo}</div>
                                      <div style={{ fontSize: '11px', color: '#6c757d' }}>
                                        {inc.cruce.nombre}
                                      </div>
                                    </>
                                  ) : 'N/A'}
                                </td>
                                <td>
                                  <span className={`badge ${
                                    ultimoSeguimiento?.estado?.nombre?.includes('RESUELTO') || ultimoSeguimiento?.estado?.nombre?.includes('FINALIZADO') 
                                      ? 'bg-success' 
                                      : ultimoSeguimiento?.estado?.nombre?.includes('PROCESO')
                                      ? 'bg-warning'
                                      : 'bg-secondary'
                                  }`}>
                                    {ultimoSeguimiento?.estado?.nombre || 'PENDIENTE'}
                                  </span>
                                </td>
                                <td style={{ fontSize: '13px' }}>
                                  {ultimoSeguimiento?.responsable?.nombre || inc.equipo?.nombre || 'Sin asignar'}
                                </td>
                                <td style={{ fontSize: '12px' }}>
                                  {fechaCierre ? (
                                    (() => {
                                      const diff = fechaCierre.getTime() - fechaReporte.getTime();
                                      const horas = Math.floor(diff / (1000 * 60 * 60));
                                      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                      
                                      if (horas > 24) {
                                        const dias = Math.floor(horas / 24);
                                        const horasRestantes = horas % 24;
                                        return `${dias}d ${horasRestantes}h`;
                                      }
                                      return `${horas}h ${minutos}m`;
                                    })()
                                  ) : (
                                    <span className="text-muted">En proceso</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={8} className="text-center py-4 text-muted">
                              No hay incidencias para mostrar con los filtros seleccionados
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
