import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import ApexCharts from 'apexcharts';
import type { ApexOptions } from 'apexcharts';
import Select from 'react-select';
import { customSelectStylesSmall } from '../../styles/react-select-custom';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { reportesGraficoService, ReporteGraficoResponse } from '../../services/reportes-grafico.service';
import { PageHeader } from '../../components/ui/PageHeader';
import { drawPdfHeader, applyPdfFooters, drawPdfMetadata, drawPdfKpiCards } from '../../utils/pdfReportHelper';

// Asignar a window por compatibilidad
if (typeof window !== 'undefined') {
  (window as any).ApexCharts = ApexCharts;
}

type PeriodoReporte = 'DIA' | 'MES' | 'ANIO';

interface Filtros {
  periodo: PeriodoReporte;
  dia?: number;
  mes?: number;
  anio: number;
}

// Paleta de colores estilo Admindek
const PALETTE = {
  primary: '#1D546D',
  secondary: '#5F9598',
  info: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  indigo: '#6366f1',
  pink: '#ec4899',
  teal: '#14b8a6',
  chartColors: ['#1D546D', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#5F9598', '#6366f1', '#14b8a6'],
};

export const ReporteGrafico: React.FC = () => {
  const currentDate = new Date();
  const [filtros, setFiltros] = useState<Filtros>({
    periodo: 'MES',
    mes: currentDate.getMonth() + 1,
    anio: currentDate.getFullYear(),
  });

  const [datos, setDatos] = useState<ReporteGraficoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

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
      toast.error('Error al cargar el reporte gráfico');
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarDatos();
  };

  const handleExportarExcel = async () => {
    setExportingExcel(true);
    try {
      await reportesGraficoService.exportarExcel(filtros);
      toast.success('Reporte Excel descargado correctamente');
    } catch (error) {
      console.error('Error exportando Excel:', error);
      toast.error('Error al descargar el archivo Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  // Helper para capturar la imagen de un gráfico (ApexCharts o SVG fallback)
  const getChartImageUri = async (chartId: string): Promise<string | null> => {
    // 1. Intentar con la API nativa de ApexCharts
    try {
      const chartInstance = ApexCharts || (window as any).ApexCharts;
      if (chartInstance && typeof chartInstance.exec === 'function') {
        const res = await chartInstance.exec(chartId, 'dataURI');
        if (res && res.imgURI) {
          return res.imgURI;
        }
      }
    } catch (err) {
      console.warn(`ApexCharts.exec falló para ${chartId}:`, err);
    }

    // 2. Fallback capturando el elemento SVG directamente del DOM
    try {
      const wrapper =
        document.getElementById(`chart-wrapper-${chartId}`) ||
        document.getElementById(chartId) ||
        document.querySelector(`[id*="${chartId}"]`) ||
        document.querySelector(`.apexcharts-canvas[id*="${chartId}"]`);

      const svgEl = (wrapper?.querySelector('svg.apexcharts-svg') ||
        wrapper?.querySelector('svg') ||
        document.querySelector(`[id*="${chartId}"] svg.apexcharts-svg`)) as SVGElement;

      if (svgEl) {
        const svgClone = svgEl.cloneNode(true) as SVGElement;
        // Quitar toolbar o elementos de control en el clon
        const toolbar = svgClone.querySelector('.apexcharts-toolbar');
        if (toolbar) toolbar.remove();

        const xml = new XMLSerializer().serializeToString(svgClone);
        const svg64 = btoa(unescape(encodeURIComponent(xml)));
        const image64 = 'data:image/svg+xml;base64,' + svg64;

        return await new Promise<string | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = 2; // Renderizado en alta definición
            const width = (svgEl.clientWidth || parseInt(svgEl.getAttribute('width') || '800', 10) || 800);
            const height = (svgEl.clientHeight || parseInt(svgEl.getAttribute('height') || '400', 10) || 400);
            
            canvas.width = width * scale;
            canvas.height = height * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(image64);
              return;
            }
            ctx.scale(scale, scale);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => resolve(null);
          img.src = image64;
        });
      }
    } catch (err) {
      console.warn(`Fallback SVG falló para ${chartId}:`, err);
    }

    return null;
  };

  const handleExportarPDF = async () => {
    if (!datos) {
      toast.error('No hay datos para exportar');
      return;
    }

    setExportingPDF(true);
    const toastId = toast.loading('Generando reporte PDF con gráficos...');

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

      let periodoTexto = '';
      if (filtros.periodo === 'MES') {
        const nombreMes = meses[(filtros.mes || 1) - 1] || '';
        periodoTexto = `${nombreMes} ${filtros.anio}`;
      } else if (filtros.periodo === 'ANIO') {
        periodoTexto = `Año ${filtros.anio}`;
      } else if (filtros.periodo === 'DIA') {
        periodoTexto = `${filtros.dia}/${filtros.mes}/${filtros.anio}`;
      }

      // Página 1: Encabezado + Metadatos + Cajas KPI
      let y = drawPdfHeader(doc, true, 'Reporte Estadístico de Incidencias y Averías');

      y = drawPdfMetadata(doc, y, [
        { label: 'Período de Análisis', value: periodoTexto },
        { label: 'Fecha de Emisión', value: new Date().toLocaleString('es-PE') },
      ]);

      // Resumen KPI en Cajas
      const kpis = [
        { label: 'TOTAL INCIDENCIAS', value: datos.resumen.totalIncidencias.toString() },
        { label: 'INTERSECCIONES AFECTADAS', value: datos.resumen.totalCruces.toString() },
        { label: 'TIPOS DISTINTOS', value: datos.resumen.totalTipos.toString() },
      ];

      y = drawPdfKpiCards(doc, y, kpis);

      // Lista de gráficos a capturar e insertar
      const chartItems = [
        { id: 'apex-chart-evolucion', title: '1. ' + getTituloEvolucion(), height: 75 },
        { id: 'apex-chart-tipo', title: '2. Distribución de Incidencias por Tipo', height: 70 },
        { id: 'apex-chart-cruce', title: '3. Top Intersecciones con Mayor Cantidad de Incidencias', height: 72 },
        { id: 'apex-chart-estado', title: '4. Estado de Incidencias Registradas', height: 68 },
        { id: 'apex-chart-top5', title: '5. Top 5 Averías - Comparativa: Atendidas vs Por Atender', height: 70 },
      ];

      for (let i = 0; i < chartItems.length; i++) {
        const item = chartItems[i];
        const imgUri = await getChartImageUri(item.id);

        if (imgUri) {
          // Si el gráfico no cabe en la página actual, agregar nueva página
          if (y + item.height + 12 > 280) {
            doc.addPage();
            y = drawPdfHeader(doc, false, 'Reporte Estadístico de Incidencias y Averías', `Período: ${periodoTexto}`);
          }

          // Título de la sección del gráfico
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(29, 84, 109);
          doc.text(item.title, 14, y);
          y += 4;

          // Imagen del gráfico
          doc.addImage(imgUri, 'PNG', 14, y, 182, item.height);
          y += item.height + 8;
        }
      }

      // Pie de página en todas las páginas
      applyPdfFooters(doc);

      const nombreArchivo = `reporte_grafico_${filtros.periodo}_${filtros.anio}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nombreArchivo);
      toast.dismiss(toastId);
      toast.success('Reporte PDF exportado exitosamente');
    } catch (error) {
      toast.dismiss(toastId);
      console.error('Error al exportar PDF:', error);
      toast.error('Error al exportar el archivo PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  const getTituloEvolucion = () => {
    switch (filtros.periodo) {
      case 'DIA':
        return 'Evolución por Hora del Día';
      case 'MES':
        return 'Evolución Diaria del Mes';
      case 'ANIO':
        return 'Evolución Mensual del Año';
      default:
        return 'Evolución Temporal';
    }
  };

  // -------------------------------------------------------------
  // 1. Configuración Gráfico de Evolución Temporal (Total + Top 4 tipos)
  // -------------------------------------------------------------
  const evolucionCategories = datos?.graficos.evolucion?.categorias || datos?.graficos.porMes.map(g => g.mes || '') || [];
  const evolucionSeries = datos?.graficos.evolucion?.series || [
    {
      name: 'Total Incidencias',
      data: datos?.graficos.porMes.map(g => g.cantidad) || [],
    },
  ];

  const evolucionColors = [
    '#1D546D', // Total Incidencias (Línea principal y área)
    '#ef4444', // Top 1 (Rojo coral)
    '#f59e0b', // Top 2 (Ámbar)
    '#06b6d4', // Top 3 (Cian)
    '#8b5cf6', // Top 4 (Púrpura)
  ];

  const evolucionOptions: ApexOptions = {
    chart: {
      id: 'apex-chart-evolucion',
      type: 'area',
      height: 330,
      toolbar: {
        show: true,
        offsetX: -5,
        offsetY: -5,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
        },
      },
      fontFamily: 'Inter, system-ui, sans-serif',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
    },
    colors: evolucionColors,
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: [3.5, 2, 2, 2, 2],
      dashArray: [0, 0, 0, 0, 0],
    },
    fill: {
      type: ['gradient', 'solid', 'solid', 'solid', 'solid'],
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
      opacity: [0.45, 0.05, 0.05, 0.05, 0.05],
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
      padding: { top: 12, left: 10, right: 15, bottom: 0 },
    },
    xaxis: {
      categories: evolucionCategories,
      labels: {
        style: { colors: '#64748b', fontSize: '11px', fontWeight: 500 },
        rotate: -30,
        trim: true,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: {
        text: 'Cant. Incidencias',
        style: { color: '#64748b', fontSize: '11px', fontWeight: 600 },
      },
      labels: {
        style: { colors: '#64748b', fontSize: '11px' },
        formatter: (val) => Math.floor(val).toString(),
      },
      min: 0,
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      offsetX: -10,
      offsetY: -5,
      fontSize: '12px',
      fontWeight: 600,
      markers: { width: 10, height: 10, radius: 12 },
      itemMargin: { horizontal: 10, vertical: 4 },
    },
    markers: {
      size: [3, 2.5, 2.5, 2.5, 2.5],
      strokeWidth: 2,
      hover: { size: 6 },
    },
    tooltip: {
      theme: 'light',
      shared: true,
      intersect: false,
      y: {
        formatter: (val) => (val !== undefined ? `${val} caso${val !== 1 ? 's' : ''}` : ''),
      },
    },
  };

  // -------------------------------------------------------------
  // 2. Configuración Gráfico por Tipo (Donut Chart Admindek)
  // -------------------------------------------------------------
  const tiposLabels = datos?.graficos.porTipo.map(g => g.tipo || '') || [];
  const tiposSeries = datos?.graficos.porTipo.map(g => g.cantidad) || [];

  const tipoOptions: ApexOptions = {
    chart: {
      id: 'apex-chart-tipo',
      type: 'donut',
      height: 300,
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    labels: tiposLabels,
    colors: PALETTE.chartColors,
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      dropShadow: { enabled: false },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '13px',
              fontWeight: 600,
              color: '#64748b',
            },
            value: {
              show: true,
              fontSize: '22px',
              fontWeight: 700,
              color: '#1D546D',
              formatter: (val) => val.toString(),
            },
            total: {
              show: true,
              label: 'Total',
              color: '#64748b',
              fontSize: '12px',
              formatter: (w) => {
                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                return total.toString();
              },
            },
          },
        },
      },
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '11px',
      markers: { width: 8, height: 8, radius: 12 },
      itemMargin: { horizontal: 6, vertical: 2 },
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `${val} evento${val !== 1 ? 's' : ''}`,
      },
    },
    stroke: {
      width: 2,
      colors: ['#ffffff'],
    },
  };

  // -------------------------------------------------------------
  // 3. Configuración Gráfico por Cruce (Horizontal Bar Chart Admindek)
  // -------------------------------------------------------------
  const crucesLabels = datos?.graficos.porCruce.map(g => g.cruce || '') || [];
  const crucesData = datos?.graficos.porCruce.map(g => g.cantidad) || [];

  const cruceOptions: ApexOptions = {
    chart: {
      id: 'apex-chart-cruce',
      type: 'bar',
      height: 300,
      toolbar: { show: false },
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: '62%',
        distributed: true,
      },
    },
    colors: PALETTE.chartColors,
    dataLabels: {
      enabled: true,
      textAnchor: 'start',
      style: {
        colors: ['#212529'],
        fontSize: '11px',
        fontWeight: 600,
      },
      formatter: (val) => val.toString(),
      offsetX: 5,
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
    },
    xaxis: {
      categories: crucesLabels,
      labels: {
        style: { colors: '#64748b', fontSize: '11px' },
      },
    },
    yaxis: {
      labels: {
        style: { colors: '#334155', fontSize: '11px', fontWeight: 500 },
        maxWidth: 180,
      },
    },
    legend: {
      show: false,
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `${val} incidencias`,
      },
    },
  };

  const cruceSeries = [
    {
      name: 'Incidencias',
      data: crucesData,
    },
  ];

  // -------------------------------------------------------------
  // 4. Configuración Gráfico por Estado (Column Bar Chart Admindek)
  // -------------------------------------------------------------
  const estadoLabels = datos?.graficos.porEstado.map(g => g.estado || '') || [];
  const estadoData = datos?.graficos.porEstado.map(g => g.cantidad) || [];

  const estadoOptions: ApexOptions = {
    chart: {
      id: 'apex-chart-estado',
      type: 'bar',
      height: 300,
      toolbar: { show: false },
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    plotOptions: {
      bar: {
        columnWidth: '45%',
        borderRadius: 6,
        distributed: true,
      },
    },
    colors: [PALETTE.warning, PALETTE.info, PALETTE.success, PALETTE.danger, PALETTE.purple],
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '11px',
        fontWeight: 600,
        colors: ['#ffffff'],
      },
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
    },
    xaxis: {
      categories: estadoLabels,
      labels: {
        style: { colors: '#64748b', fontSize: '11px', fontWeight: 500 },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: '#64748b', fontSize: '11px' },
        formatter: (val) => Math.floor(val).toString(),
      },
      min: 0,
    },
    legend: {
      show: false,
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `${val} registros`,
      },
    },
  };

  const estadoSeries = [
    {
      name: 'Cantidad',
      data: estadoData,
    },
  ];

  // -------------------------------------------------------------
  // 5. Configuración Top 5 Averías (Grouped Column Chart Admindek)
  // -------------------------------------------------------------
  const top5Labels = datos?.graficos.top5Averias?.map(a => a.tipo) || [];
  const top5Atendidas = datos?.graficos.top5Averias?.map(a => a.atendidas) || [];
  const top5PorAtender = datos?.graficos.top5Averias?.map(a => a.porAtender) || [];

  const top5Options: ApexOptions = {
    chart: {
      id: 'apex-chart-top5',
      type: 'bar',
      height: 320,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
        },
      },
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '10px',
        fontWeight: 600,
        colors: ['#ffffff'],
      },
    },
    colors: [PALETTE.success, PALETTE.danger],
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
    },
    xaxis: {
      categories: top5Labels,
      labels: {
        style: { colors: '#334155', fontSize: '11px', fontWeight: 500 },
        rotate: -20,
        trim: true,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: {
        text: 'Cantidad de Averías',
        style: { color: '#64748b', fontSize: '11px', fontWeight: 600 },
      },
      labels: {
        style: { colors: '#64748b', fontSize: '11px' },
        formatter: (val) => Math.floor(val).toString(),
      },
      min: 0,
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '12px',
      markers: { width: 10, height: 10, radius: 12 },
    },
    fill: {
      opacity: 0.95,
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `${val} casos`,
      },
    },
  };

  const top5Series = [
    {
      name: 'Atendidas',
      data: top5Atendidas,
    },
    {
      name: 'Por Atender',
      data: top5PorAtender,
    },
  ];

  return (
    <div className="container-fluid p-3">
      {/* Header */}
      <PageHeader
        icon="fa-solid fa-chart-line"
        title="Reporte Gráfico de Incidencias"
        subtitle="Visualización analítica, series temporales y distribución interactiva con ApexCharts"
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
              type="button"
              className="btn btn-sm btn-success"
              onClick={handleExportarExcel}
              disabled={!datos || loading || exportingExcel}
            >
              {exportingExcel ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  Exportando...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-file-excel me-1"></i>
                  Excel
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={handleExportarPDF}
              disabled={!datos || loading || exportingPDF}
            >
              {exportingPDF ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  Generando PDF...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-file-pdf me-1"></i>
                  PDF
                </>
              )}
            </button>
          </div>
        }
      />

      {/* Panel de filtros */}
      {showFilters && (
        <div className="card border shadow-sm mb-3">
          <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
            <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '13px' }}>
              <i className="fa-solid fa-sliders me-2 text-primary"></i>
              Filtros de Análisis
            </h6>
          </div>
          <div className="card-body py-2 px-3">
            <form onSubmit={handleBuscar}>
              <div className="row g-2 align-items-end">
                {/* Periodo */}
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted mb-1">
                    <i className="fa-solid fa-calendar me-1"></i> Periodo
                  </label>
                  <Select
                    options={[
                      { value: 'DIA', label: 'Día' },
                      { value: 'MES', label: 'Mes' },
                      { value: 'ANIO', label: 'Año' },
                    ]}
                    value={{
                      value: filtros.periodo,
                      label: filtros.periodo === 'DIA' ? 'Día' : filtros.periodo === 'MES' ? 'Mes' : 'Año',
                    }}
                    onChange={(option) =>
                      setFiltros({
                        ...filtros,
                        periodo: (option?.value as PeriodoReporte) || 'MES',
                      })
                    }
                    styles={customSelectStylesSmall}
                  />
                </div>

                {/* Día */}
                {filtros.periodo === 'DIA' && (
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-muted mb-1">
                      <i className="fa-solid fa-calendar-day me-1"></i> Día
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
                          dia: parseInt(e.target.value, 10),
                        })
                      }
                    />
                  </div>
                )}

                {/* Mes */}
                {(filtros.periodo === 'DIA' || filtros.periodo === 'MES') && (
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-muted mb-1">
                      <i className="fa-solid fa-calendar-days me-1"></i> Mes
                    </label>
                    <Select
                      options={[
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
                      ]}
                      value={
                        filtros.mes
                          ? {
                              value: filtros.mes,
                              label: [
                                'Enero',
                                'Febrero',
                                'Marzo',
                                'Abril',
                                'Mayo',
                                'Junio',
                                'Julio',
                                'Agosto',
                                'Septiembre',
                                'Octubre',
                                'Noviembre',
                                'Diciembre',
                              ][filtros.mes - 1],
                            }
                          : null
                      }
                      onChange={(option) =>
                        setFiltros({
                          ...filtros,
                          mes: option?.value || new Date().getMonth() + 1,
                        })
                      }
                      styles={customSelectStylesSmall}
                    />
                  </div>
                )}

                {/* Año */}
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted mb-1">
                    <i className="fa-solid fa-calendar-week me-1"></i> Año
                  </label>
                  <Select
                    options={Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => ({
                      value: year,
                      label: year.toString(),
                    }))}
                    value={{ value: filtros.anio, label: filtros.anio.toString() }}
                    onChange={(option) =>
                      setFiltros({
                        ...filtros,
                        anio: option?.value || new Date().getFullYear(),
                      })
                    }
                    styles={customSelectStylesSmall}
                  />
                </div>

                {/* Botón Consultar */}
                <div className="col-md-3 d-flex">
                  <button type="submit" className="btn btn-sm btn-primary w-100 py-1" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1"></span>
                        Consultando...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-magnifying-glass me-1"></i>
                        Consultar Gráficos
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resumen / Widgets estilo Admindek */}
      {datos && (
        <div className="row g-2 mb-3">
          <div className="col-xl-3 col-md-6">
            <div className="card card-widget mb-0 h-100 border shadow-sm">
              <div className="card-body p-2 px-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="widget-subheading text-uppercase text-muted fw-bold" style={{ fontSize: '11px' }}>
                    TOTAL INCIDENCIAS
                  </div>
                  <div className="widget-icon-box text-primary" style={{ width: '32px', height: '32px' }}>
                    <i className="fa-solid fa-circle-exclamation"></i>
                  </div>
                </div>
                <div className="widget-numbers text-primary mb-0" style={{ fontSize: '22px' }}>
                  {datos.resumen.totalIncidencias}
                </div>
                <small className="text-muted d-block" style={{ fontSize: '10px' }}>
                  Eventos analizados en el período
                </small>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="card card-widget mb-0 h-100 border shadow-sm">
              <div className="card-body p-2 px-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="widget-subheading text-uppercase text-muted fw-bold" style={{ fontSize: '11px' }}>
                    INTERSECCIONES AFECTADAS
                  </div>
                  <div className="widget-icon-box text-warning" style={{ width: '32px', height: '32px' }}>
                    <i className="fa-solid fa-traffic-light"></i>
                  </div>
                </div>
                <div className="widget-numbers text-warning mb-0" style={{ fontSize: '22px' }}>
                  {datos.resumen.totalCruces}
                </div>
                <small className="text-muted d-block" style={{ fontSize: '10px' }}>
                  Intersecciones con reportes
                </small>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="card card-widget mb-0 h-100 border shadow-sm">
              <div className="card-body p-2 px-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="widget-subheading text-uppercase text-muted fw-bold" style={{ fontSize: '11px' }}>
                    TIPOS DIFERENTES
                  </div>
                  <div className="widget-icon-box text-info" style={{ width: '32px', height: '32px' }}>
                    <i className="fa-solid fa-tags"></i>
                  </div>
                </div>
                <div className="widget-numbers text-info mb-0" style={{ fontSize: '22px' }}>
                  {datos.resumen.totalTipos}
                </div>
                <small className="text-muted d-block" style={{ fontSize: '10px' }}>
                  Categorías de fallas detectadas
                </small>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="card card-widget mb-0 h-100 border shadow-sm">
              <div className="card-body p-2 px-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="widget-subheading text-uppercase text-muted fw-bold" style={{ fontSize: '11px' }}>
                    PANEL DE VISUALIZACIÓN
                  </div>
                  <div className="widget-icon-box text-success" style={{ width: '32px', height: '32px' }}>
                    <i className="fa-solid fa-chart-pie"></i>
                  </div>
                </div>
                <div className="widget-numbers text-success mb-0" style={{ fontSize: '22px' }}>
                  5 Gráficos
                </div>
                <small className="text-muted d-block" style={{ fontSize: '10px' }}>
                  ApexCharts interactivo activo
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos ApexCharts estilo Admindek */}
      {datos && (
        <div className="row g-3 mb-3">
          {/* 1. Evolución Temporal (Total + Top 4 Tipos) */}
          <div className="col-12">
            <div className="card border shadow-sm">
              <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
                <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '13px' }}>
                  <i className="fa-solid fa-chart-area me-2 text-primary"></i>
                  {getTituloEvolucion()}
                </h6>
                <span className="badge bg-light text-primary border">Total + Top 4 Averías</span>
              </div>
              <div className="card-body p-2" id="chart-wrapper-apex-chart-evolucion">
                {evolucionCategories.length > 0 ? (
                  <Chart options={evolucionOptions} series={evolucionSeries} type="area" height={320} />
                ) : (
                  <div className="alert alert-warning py-2 mb-0" style={{ fontSize: '13px' }}>
                    <i className="fa-solid fa-triangle-exclamation me-2"></i>
                    No hay datos de evolución temporal en el período seleccionado.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Incidencias por Tipo (Donut Chart) */}
          <div className="col-lg-6">
            <div className="card border shadow-sm h-100">
              <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
                <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '13px' }}>
                  <i className="fa-solid fa-chart-pie me-2 text-info"></i>
                  Incidencias por Tipo (Problema - Cruce)
                </h6>
                <span className="badge bg-light text-secondary border">Dona</span>
              </div>
              <div className="card-body p-2 d-flex align-items-center justify-content-center" id="chart-wrapper-apex-chart-tipo">
                {tiposSeries.length > 0 ? (
                  <div style={{ width: '100%' }}>
                    <Chart options={tipoOptions} series={tiposSeries} type="donut" height={300} />
                  </div>
                ) : (
                  <div className="alert alert-warning py-2 mb-0 w-100" style={{ fontSize: '13px' }}>
                    <i className="fa-solid fa-triangle-exclamation me-2"></i>
                    No hay datos de incidencias por tipo.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Incidencias por Intersección (Horizontal Bar Chart) */}
          <div className="col-lg-6">
            <div className="card border shadow-sm h-100">
              <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
                <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '13px' }}>
                  <i className="fa-solid fa-chart-simple me-2 text-primary"></i>
                  Top Intersecciones con más Incidencias
                </h6>
                <span className="badge bg-light text-secondary border">Barras horizontales</span>
              </div>
              <div className="card-body p-2" id="chart-wrapper-apex-chart-cruce">
                {crucesData.length > 0 ? (
                  <Chart options={cruceOptions} series={cruceSeries} type="bar" height={300} />
                ) : (
                  <div className="alert alert-warning py-2 mb-0" style={{ fontSize: '13px' }}>
                    <i className="fa-solid fa-triangle-exclamation me-2"></i>
                    No hay datos de incidencias por intersección.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Incidencias por Estado (Column Chart) */}
          <div className="col-lg-6">
            <div className="card border shadow-sm h-100">
              <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
                <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '13px' }}>
                  <i className="fa-solid fa-list-check me-2 text-warning"></i>
                  Incidencias por Estado
                </h6>
                <span className="badge bg-light text-secondary border">Columnas</span>
              </div>
              <div className="card-body p-2" id="chart-wrapper-apex-chart-estado">
                {estadoData.length > 0 ? (
                  <Chart options={estadoOptions} series={estadoSeries} type="bar" height={280} />
                ) : (
                  <div className="alert alert-warning py-2 mb-0" style={{ fontSize: '13px' }}>
                    <i className="fa-solid fa-triangle-exclamation me-2"></i>
                    No hay datos de incidencias por estado.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. Top 5 Averías: Atendidas vs Por Atender (Grouped Column Chart) */}
          <div className="col-lg-6">
            <div className="card border shadow-sm h-100">
              <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
                <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '13px' }}>
                  <i className="fa-solid fa-trophy me-2 text-success"></i>
                  Top 5 Averías: Atendidas vs Por Atender
                </h6>
                <span className="badge bg-light text-secondary border">Barras agrupadas</span>
              </div>
              <div className="card-body p-2" id="chart-wrapper-apex-chart-top5">
                {top5Labels.length > 0 ? (
                  <Chart options={top5Options} series={top5Series} type="bar" height={280} />
                ) : (
                  <div className="alert alert-warning py-2 mb-0" style={{ fontSize: '13px' }}>
                    <i className="fa-solid fa-triangle-exclamation me-2"></i>
                    No hay datos de ranking de averías.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay datos */}
      {!datos && !loading && (
        <div className="alert alert-warning py-3">
          <i className="fa-solid fa-triangle-exclamation me-2"></i>
          No hay datos para mostrar. Seleccione los filtros y presione Consultar Gráficos.
        </div>
      )}
    </div>
  );
};

export default ReporteGrafico;
