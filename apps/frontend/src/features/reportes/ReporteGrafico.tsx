import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import { reportesGraficoService, ReporteGraficoResponse } from '../../services/reportes-grafico.service';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

type PeriodoReporte = 'DIA' | 'MES' | 'ANIO';

interface Filtros {
  periodo: PeriodoReporte;
  dia?: number;
  mes?: number;
  anio: number;
}

const ReporteGrafico: React.FC = () => {
  const [filtros, setFiltros] = useState<Filtros>({
    periodo: 'MES',
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
  });

  const [datos, setDatos] = useState<ReporteGraficoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Referencias a los gráficos
  const chartTipoRef = useRef<any>(null);
  const chartCruceRef = useRef<any>(null);
  const chartEstadoRef = useRef<any>(null);
  const chartEvolucionRef = useRef<any>(null);
  const chartTop5Ref = useRef<any>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const response = await reportesGraficoService.getReporteGrafico(filtros);
      setDatos(response);
    } catch (error) {
      console.error('Error al cargar datos del reporte:', error);
      alert('Error al cargar el reporte gráfico');
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarDatos();
  };

  const handleExportarPDF = async () => {
    try {
      if (!datos) {
        alert('No hay datos para exportar');
        return;
      }

      const doc = new jsPDF();
      
      // Encabezado
      doc.setFontSize(18);
      doc.text('Sistema de Monitoreo de Semáforos', 105, 15, { align: 'center' });
      doc.setFontSize(14);
      doc.text('Reporte Gráfico de Incidencias', 105, 24, { align: 'center' });
      
      // Información del periodo
      doc.setFontSize(10);
      let periodoTexto = '';
      if (filtros.periodo === 'MES') {
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const nombreMes = meses[filtros.mes! - 1] || '';
        periodoTexto = `Periodo: ${nombreMes} ${filtros.anio}`;
      } else if (filtros.periodo === 'ANIO') {
        periodoTexto = `Periodo: Año ${filtros.anio}`;
      } else if (filtros.periodo === 'DIA') {
        periodoTexto = `Periodo: ${filtros.dia}/${filtros.mes}/${filtros.anio}`;
      }
      
      doc.text(periodoTexto, 105, 32, { align: 'center' });
      doc.text(`Total de incidencias: ${datos.resumen.totalIncidencias}`, 105, 38, { align: 'center' });
      doc.text(`Fecha de generación: ${new Date().toLocaleString('es-PE')}`, 105, 44, { align: 'center' });
      
      doc.setLineWidth(0.5);
      doc.line(10, 48, 200, 48);
      
      let y = 54;
      
      // Capturar gráficos como imágenes
      const capturarGrafico = (chartRef: any, titulo: string) => {
        if (chartRef.current) {
          try {
            const canvas = chartRef.current.canvas;
            return canvas.toDataURL('image/png');
          } catch (e) {
            console.error(`Error capturando gráfico ${titulo}:`, e);
            return null;
          }
        }
        return null;
      };
      
      // Gráfico por Tipo (Problema - Cruce)
      if (datos.graficos.porTipo.length > 0 && chartTipoRef.current) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Incidencias por Tipo (Problema - Cruce)', 105, y, { align: 'center' });
        y += 6;
        
        const imgTipo = capturarGrafico(chartTipoRef, 'Tipo');
        if (imgTipo) {
          doc.addImage(imgTipo, 'PNG', 30, y, 150, 90);
          y += 95;
        }
      }
      
      // Gráfico por Cruce
      if (datos.graficos.porCruce.length > 0 && chartCruceRef.current) {
        if (y > 200) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Top 10 Cruces con más Incidencias', 105, y, { align: 'center' });
        y += 6;
        
        const imgCruce = capturarGrafico(chartCruceRef, 'Cruce');
        if (imgCruce) {
          doc.addImage(imgCruce, 'PNG', 30, y, 150, 90);
          y += 95;
        }
      }
      
      // Gráfico por Estado
      if (datos.graficos.porEstado.length > 0 && chartEstadoRef.current) {
        if (y > 200) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Incidencias por Estado', 105, y, { align: 'center' });
        y += 6;
        
        const imgEstado = capturarGrafico(chartEstadoRef, 'Estado');
        if (imgEstado) {
          doc.addImage(imgEstado, 'PNG', 30, y, 150, 90);
          y += 95;
        }
      }
      
      // Nueva página para evolución temporal
      doc.addPage();
      y = 20;
      
      // Gráfico de Evolución Temporal
      if (datos.graficos.porMes.length > 0 && chartEvolucionRef.current) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(getTituloEvolucion(), 105, y, { align: 'center' });
        y += 6;
        
        const imgEvolucion = capturarGrafico(chartEvolucionRef, 'Evolución');
        if (imgEvolucion) {
          doc.addImage(imgEvolucion, 'PNG', 30, y, 150, 90);
          y += 95;
        }
      }
      
      // Gráfico Top 5 Averías
      if (datos.graficos.top5Averias && datos.graficos.top5Averias.length > 0 && chartTop5Ref.current) {
        if (y > 200) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Top 5 Averías Más Reportadas - Atendidas vs Por Atender', 105, y, { align: 'center' });
        y += 6;
        
        const imgTop5 = capturarGrafico(chartTop5Ref, 'Top5');
        if (imgTop5) {
          doc.addImage(imgTop5, 'PNG', 30, y, 150, 90);
          y += 95;
        }
      }
      
      // Guardar PDF
      const nombreArchivo = `reporte_grafico_${filtros.periodo}_${filtros.anio}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nombreArchivo);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al exportar el archivo PDF');
    }
  };

  // Configuración del gráfico por tipo
  const graficoPorTipo = {
    labels: datos?.graficos.porTipo.map(g => g.tipo) || [],
    datasets: [
      {
        label: 'Cantidad',
        data: datos?.graficos.porTipo.map(g => g.cantidad) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Configuración del gráfico por cruce
  const graficoPorCruce = {
    labels: datos?.graficos.porCruce.map(g => g.cruce) || [],
    datasets: [
      {
        label: 'Cantidad de Incidencias',
        data: datos?.graficos.porCruce.map(g => g.cantidad) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const opcionesBarras = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
  };

  // Configuración del gráfico por estado
  const graficoPorEstado = {
    labels: datos?.graficos.porEstado.map(g => g.estado) || [],
    datasets: [
      {
        label: 'Cantidad',
        data: datos?.graficos.porEstado.map(g => g.cantidad) || [],
        backgroundColor: [
          'rgba(255, 159, 64, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 99, 132, 0.5)',
        ],
        borderColor: [
          'rgba(255, 159, 64, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Configuración del gráfico de evolución temporal (adaptativo según periodo)
  const getTituloEvolucion = () => {
    switch (filtros.periodo) {
      case 'DIA':
        return 'Evolución por Hora del Día';
      case 'MES':
        return 'Evolución por Días del Mes';
      case 'ANIO':
        return 'Evolución por Meses del Año';
      default:
        return 'Evolución Temporal';
    }
  };

  const graficoPorMes = {
    labels: datos?.graficos.porMes.map(g => g.mes) || [],
    datasets: [
      {
        label: getTituloEvolucion(),
        data: datos?.graficos.porMes.map(g => g.cantidad) || [],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const opcionesLinea = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: getTituloEvolucion(),
        font: {
          size: 14,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cantidad de Incidencias',
        },
      },
      x: {
        title: {
          display: true,
          text: filtros.periodo === 'DIA' ? 'Hora' : filtros.periodo === 'MES' ? 'Día del Mes' : 'Mes',
        },
      },
    },
  };

  // Configuración del gráfico Top 5 Averías (atendidas vs por atender)
  const graficoTop5Averias = {
    labels: datos?.graficos.top5Averias?.map(a => a.tipo) || [],
    datasets: [
      {
        label: 'Atendidas',
        data: datos?.graficos.top5Averias?.map(a => a.atendidas) || [],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
      },
      {
        label: 'Por Atender',
        data: datos?.graficos.top5Averias?.map(a => a.porAtender) || [],
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
      },
    ],
  };

  const opcionesBarras3D = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Comparativa: Atendidas vs Por Atender',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          afterLabel: function(context: any) {
            const index = context.dataIndex;
            const total = datos?.graficos.top5Averias?.[index]?.total || 0;
            return `Total: ${total}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
        title: {
          display: true,
          text: 'Cantidad de Incidencias',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Tipos de Incidencias',
        },
      },
    },
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <i className="fas fa-chart-line me-2"></i>
          Reporte Gráfico de Incidencias
        </h2>
      </div>

      {/* Panel de filtros */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-bottom">
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className="fas fa-filter me-2"></i>
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
        </div>
        {showFilters && (
        <div className="card-body">
          <form onSubmit={handleBuscar}>
            <div className="row g-2">
              {/* Periodo */}
              <div className="col-md-3">
                <label className="form-label small">
                  <i className="fas fa-calendar-alt me-2"></i>
                  Periodo
                </label>
                <select
                  className="form-select form-select-sm"
                  value={filtros.periodo}
                  onChange={(e) =>
                    setFiltros({
                      ...filtros,
                      periodo: e.target.value as 'DIA' | 'MES' | 'ANIO',
                    })
                  }
                >
                  <option value="DIA">Día</option>
                  <option value="MES">Mes</option>
                  <option value="ANIO">Año</option>
                </select>
              </div>

              {/* Día */}
              {filtros.periodo === 'DIA' && (
                <div className="col-md-3">
                  <label className="form-label small">
                    <i className="fas fa-calendar-day me-2"></i>
                    Día
                  </label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min="1"
                    max="31"
                    value={filtros.dia || ''}
                    onChange={(e) =>
                      setFiltros({
                        ...filtros,
                        dia: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              )}

              {/* Mes */}
              {(filtros.periodo === 'DIA' || filtros.periodo === 'MES') && (
                <div className="col-md-3">
                  <label className="form-label small">
                    <i className="fas fa-calendar-alt me-2"></i>
                    Mes
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={filtros.mes}
                    onChange={(e) =>
                      setFiltros({
                        ...filtros,
                        mes: parseInt(e.target.value),
                      })
                    }
                  >
                    <option value="1">Enero</option>
                    <option value="2">Febrero</option>
                    <option value="3">Marzo</option>
                    <option value="4">Abril</option>
                    <option value="5">Mayo</option>
                    <option value="6">Junio</option>
                    <option value="7">Julio</option>
                    <option value="8">Agosto</option>
                    <option value="9">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                  </select>
                </div>
              )}

              {/* Año */}
              <div className="col-md-3">
                <label className="form-label small">
                  <i className="fas fa-calendar me-2"></i>
                  Año
                </label>
                <select
                  className="form-select form-select-sm"
                  value={filtros.anio}
                  onChange={(e) =>
                    setFiltros({
                      ...filtros,
                      anio: parseInt(e.target.value),
                    })
                  }
                >
                  {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Botones */}
              <div className="col-12 d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-sm btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Cargando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-search me-2"></i>
                      Buscar
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={handleExportarPDF}
                  disabled={!datos || loading}
                >
                  <i className="fas fa-file-pdf me-2"></i>
                  Exportar a PDF
                </button>
              </div>
            </div>
          </form>
        </div>
        )}
      </div>

      {/* Resumen */}
      {datos && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card shadow-sm border-0">
              <div className="card-body text-center">
                <h5 className="text-muted">Total Incidencias</h5>
                <h2 className="text-primary">{datos.resumen.totalIncidencias}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0">
              <div className="card-body text-center">
                <h5 className="text-muted">Tipos Diferentes</h5>
                <h2 className="text-info">{datos.resumen.totalTipos}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0">
              <div className="card-body text-center">
                <h5 className="text-muted">Cruces Afectados</h5>
                <h2 className="text-warning">{datos.resumen.totalCruces}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0">
              <div className="card-body text-center">
                <h5 className="text-muted">Gráficos Disponibles</h5>
                <h2 className="text-success">5</h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      {datos && (
        <div className="row mb-4">
          <div className="col-md-6 mb-3">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-light">
                <h5 className="mb-0">Incidencias por Tipo (Problema - Cruce)</h5>
              </div>
              <div className="card-body">
                {datos.graficos.porTipo.length > 0 ? (
                  <Pie ref={chartTipoRef} data={graficoPorTipo} />
                ) : (
                  <div className="alert alert-warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    No hay datos de incidencias por tipo en el período seleccionado
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-6 mb-3">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-light">
                <h5 className="mb-0">Incidencias por Cruce</h5>
              </div>
              <div className="card-body">
                {datos.graficos.porCruce.length > 0 ? (
                  <Bar ref={chartCruceRef} data={graficoPorCruce} options={opcionesBarras} />
                ) : (
                  <div className="alert alert-warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    No hay datos de incidencias por cruce
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-6 mb-3">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-light">
                <h5 className="mb-0">Incidencias por Estado</h5>
              </div>
              <div className="card-body">
                {datos.graficos.porEstado.length > 0 ? (
                  <Bar ref={chartEstadoRef} data={graficoPorEstado} options={opcionesBarras} />
                ) : (
                  <div className="alert alert-warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    No hay datos de incidencias por estado
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-6 mb-3">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-light">
                <h5 className="mb-0">Evolución Temporal</h5>
              </div>
              <div className="card-body">
                {datos.graficos.porMes.length > 0 ? (
                  <Line ref={chartEvolucionRef} data={graficoPorMes} options={opcionesLinea} />
                ) : (
                  <div className="alert alert-warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    No hay datos de evolución temporal
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-12 mb-3">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <h5 className="mb-0">
                  <i className="fas fa-trophy me-2"></i>
                  Top 5 Averías Más Reportadas - Atendidas vs Por Atender
                </h5>
              </div>
              <div className="card-body">
                {datos.graficos.top5Averias && datos.graficos.top5Averias.length > 0 ? (
                  <Bar ref={chartTop5Ref} data={graficoTop5Averias} options={opcionesBarras3D} />
                ) : (
                  <div className="alert alert-warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    No hay datos de ranking de averías
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Mensaje cuando no hay datos */}
      {!datos && !loading && (
        <div className="alert alert-warning">
          <i className="fas fa-exclamation-triangle me-2"></i>
          No hay datos para mostrar. Seleccione los filtros y presione Buscar.
        </div>
      )}
    </div>
  );
};

export default ReporteGrafico;
