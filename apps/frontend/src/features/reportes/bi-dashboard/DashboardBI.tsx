import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ApexCharts from 'apexcharts';

import { PageHeader } from '../../../components/ui/PageHeader';
import { drawPdfHeader, applyPdfFooters, drawPdfMetadata, drawPdfKpiCards, getPdfTableStyles, PDF_COLORS } from '../../../utils/pdfReportHelper';
import {
  biDashboardService,
  FullBiDashboardData,
  BiFilterOptions,
  QueryBiDashboardDto,
} from '../../../services/bi-dashboard.service';

import { BiKpiCard } from './components/BiKpiCard';
import { BiFiltersBar } from './components/BiFiltersBar';
import { BiMonthlyTrendChart } from './components/BiMonthlyTrendChart';
import { BiCausesChart } from './components/BiCausesChart';
import { BiTeamsChart } from './components/BiTeamsChart';
import { BiDistrictsTable } from './components/BiDistrictsTable';
import { BiStatusPieChart } from './components/BiStatusPieChart';

export const DashboardBI: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<BiFilterOptions>({
    years: [new Date().getFullYear()],
    months: [],
    administradores: [],
    equipos: [],
    distritos: [],
  });

  const [filters, setFilters] = useState<QueryBiDashboardDto>({
    anho: new Date().getFullYear(),
  });

  const [dashboardData, setDashboardData] = useState<FullBiDashboardData | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);

  // Load filter options on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const opts = await biDashboardService.getFilterOptions();
        setFilterOptions(opts);
      } catch (err) {
        console.error('Error al cargar opciones de filtro BI:', err);
      }
    };
    loadFilters();
  }, []);

  // Fetch dashboard data whenever filters change
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await biDashboardService.getDashboardData(filters);
      setDashboardData(data);
    } catch (err) {
      console.error('Error al cargar datos del Dashboard BI:', err);
      toast.error('Error al cargar los indicadores del Dashboard Ejecutivo');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleFilterChange = (newFilters: QueryBiDashboardDto) => {
    setFilters(newFilters);
  };

  const handleDistrictSelect = (distrito: string) => {
    setFilters((prev) => ({
      ...prev,
      distrito: distrito || undefined,
    }));
  };

  // Helper to capture chart URI for PDF export
  const getChartImageUri = async (chartId: string): Promise<string | null> => {
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
    return null;
  };

  // PDF Export
  const handleExportPDF = async () => {
    if (!dashboardData) {
      toast.error('No hay datos disponibles para exportar');
      return;
    }

    setExportingPDF(true);
    const toastId = toast.loading('Generando Reporte Ejecutivo BI en PDF...');

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const tableStyles = getPdfTableStyles();

      // Page 1: Header + Meta + KPIs + Monthly Trend + Status Pie
      let y = drawPdfHeader(doc, true, 'Dashboard Ejecutivo de Gestión y Monitoreo');

      // Metadatos
      y = drawPdfMetadata(doc, y, [
        { label: 'Período', value: `Año ${filters.anho || 'Todos'}${filters.mes ? ` / Mes ${filters.mes}` : ''}` },
        { label: 'Distrito', value: filters.distrito || 'Todos los Distritos' },
        { label: 'Fecha Emisión', value: new Date().toLocaleString('es-PE') },
      ]);

      // KPI boxes
      const kpis = dashboardData.kpis;
      const kpiItems = [
        { label: 'TOTAL INCIDENCIAS', value: kpis.totalIncidencias.toLocaleString(), color: PDF_COLORS.primary },
        { label: 'ATENDIDAS', value: kpis.incidenciasAtendidas.toLocaleString(), color: PDF_COLORS.success },
        { label: '% RESOLUCIÓN', value: `${kpis.tasaResolucion}%`, color: PDF_COLORS.success },
        { label: 'INTERSECCIONES', value: kpis.interseccionesAfectadas.toLocaleString(), color: PDF_COLORS.secondary },
        { label: 'TIEMPO ATENCIÓN', value: `${kpis.tiempoPromedioHoras}h (${kpis.tiempoPromedioDias}d)`, color: PDF_COLORS.warning },
        { label: 'CRÍTICAS', value: kpis.incidenciasCriticas.toLocaleString(), color: PDF_COLORS.danger },
      ];

      y = drawPdfKpiCards(doc, y, kpiItems);

      // Chart 1: Monthly Trend
      const imgMonthly = await getChartImageUri('bi-chart-monthly-trend');
      if (imgMonthly) {
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
        doc.text('1. Evolución Mensual: Volumen de Incidencias vs Tiempo de Atención', 14, y);
        y += 3;
        doc.addImage(imgMonthly, 'PNG', 14, y, 182, 65);
        y += 70;
      }

      // Chart 2: Status & Causes
      const imgStatus = await getChartImageUri('bi-chart-status');
      const imgCauses = await getChartImageUri('bi-chart-causes');

      if (imgStatus && imgCauses) {
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
        doc.text('2. Distribución por Estado y Principales Causas', 14, y);
        y += 3;
        doc.addImage(imgStatus, 'PNG', 14, y, 88, 65);
        doc.addImage(imgCauses, 'PNG', 106, y, 90, 65);
        y += 70;
      }

      // Page 2: Teams Chart + Districts Table
      doc.addPage();
      let page2Y = drawPdfHeader(doc, false, 'Dashboard Ejecutivo de Gestión y Monitoreo', `Año ${filters.anho || 'Todos'}`);

      const imgTeams = await getChartImageUri('bi-chart-teams');
      if (imgTeams) {
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
        doc.text('3. Desempeño y Carga de Trabajo por Cuadrilla / Equipo', 14, page2Y);
        page2Y += 3;
        doc.addImage(imgTeams, 'PNG', 14, page2Y, 182, 65);
        page2Y += 72;
      }

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
      doc.text('4. Ranking de Incidencias y Desempeño por Distrito', 14, page2Y);
      page2Y += 4;

      // Table using autotable
      const tableData = dashboardData.districts.map((d) => [
        d.distrito,
        d.total.toLocaleString(),
        `${d.porcentajeTotal}%`,
        d.crucesAfectados.toString(),
        d.resueltos.toString(),
        `${d.tasaResolucion}%`,
      ]);

      autoTable(doc, {
        ...tableStyles,
        startY: page2Y,
        head: [['Distrito', 'Incidencias', '% Total', 'Cruces', 'Resueltas', '% Resolución']],
        body: tableData,
        columnStyles: {
          0: { cellWidth: 50, halign: 'left' },
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'center' },
        },
      });

      // Footers
      applyPdfFooters(doc);

      const fileName = `dashboard_ejecutivo_bi_${filters.anho || 'todos'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.dismiss(toastId);
      toast.success('Reporte Ejecutivo BI exportado exitosamente');
    } catch (error) {
      toast.dismiss(toastId);
      console.error('Error exporting PDF:', error);
      toast.error('Error al generar el reporte PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!dashboardData) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Distrito,Total Incidencias,Porcentaje Total,Intersecciones Afectadas,Resueltas,Tasa Resolucion\n';

    dashboardData.districts.forEach((d) => {
      csvContent += `"${d.distrito}",${d.total},${d.porcentajeTotal}%,${d.crucesAfectados},${d.resueltos},${d.tasaResolucion}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BI_Distritos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Archivo CSV descargado correctamente');
  };

  const kpis = dashboardData?.kpis || {
    totalIncidencias: 0,
    incidenciasAtendidas: 0,
    incidenciasPendientes: 0,
    incidenciasEnProceso: 0,
    tasaResolucion: 0,
    interseccionesAfectadas: 0,
    interseccionesAtendidas: 0,
    tiempoPromedioHoras: 0,
    tiempoPromedioDias: 0,
    incidenciasCriticas: 0,
  };

  return (
    <div className="container-fluid p-3">
      {/* Header */}
      <PageHeader
        icon="fa-solid fa-chart-line"
        title="Dashboard Ejecutivo BI"
        subtitle="Módulo de inteligencia de negocios: Indicadores clave (KPI), series temporales y rendimiento operativo"
        actions={
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={fetchDashboardData}
              disabled={loading}
              title="Recargar datos"
            >
              <i className={`fa-solid fa-arrows-rotate me-1 ${loading ? 'fa-spin' : ''}`}></i>
              Actualizar
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-success"
              onClick={handleExportCSV}
              disabled={loading || !dashboardData}
            >
              <i className="fa-solid fa-file-csv me-1"></i>
              CSV
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={handleExportPDF}
              disabled={loading || exportingPDF || !dashboardData}
            >
              <i className={`fa-solid ${exportingPDF ? 'fa-spinner fa-spin' : 'fa-file-pdf'} me-1`}></i>
              {exportingPDF ? 'Generando...' : 'Exportar PDF'}
            </button>
          </div>
        }
      />

      {/* Filter Bar */}
      <BiFiltersBar
        filterOptions={filterOptions}
        filters={filters}
        onFilterChange={handleFilterChange}
        loading={loading}
      />

      {/* KPI Cards Row */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-sm-6 col-md-4 col-xl-2">
          <BiKpiCard
            title="Total Incidencias"
            value={kpis.totalIncidencias}
            icon="fa-solid fa-clipboard-list"
            colorVariant="primary"
            subtext="Eventos registrados"
          />
        </div>
        <div className="col-12 col-sm-6 col-md-4 col-xl-2">
          <BiKpiCard
            title="Incidencias Resueltas"
            value={kpis.incidenciasAtendidas}
            icon="fa-solid fa-circle-check"
            colorVariant="success"
            subtext={`${kpis.incidenciasEnProceso} en proceso`}
          />
        </div>
        <div className="col-12 col-sm-6 col-md-4 col-xl-2">
          <BiKpiCard
            title="Tasa de Resolución"
            value={`${kpis.tasaResolucion}%`}
            icon="fa-solid fa-percent"
            colorVariant={kpis.tasaResolucion >= 80 ? 'success' : kpis.tasaResolucion >= 50 ? 'warning' : 'danger'}
            subtext="Efectividad de cierre"
          />
        </div>
        <div className="col-12 col-sm-6 col-md-4 col-xl-2">
          <BiKpiCard
            title="Cruces Afectados"
            value={kpis.interseccionesAfectadas}
            icon="fa-solid fa-traffic-light"
            colorVariant="info"
            subtext="Puntos semafóricos"
          />
        </div>
        <div className="col-12 col-sm-6 col-md-4 col-xl-2">
          <BiKpiCard
            title="Tiempo Prom. Atención"
            value={`${kpis.tiempoPromedioHoras}h`}
            icon="fa-solid fa-clock-rotate-left"
            colorVariant="warning"
            subtext={`Aprox. ${kpis.tiempoPromedioDias} días`}
          />
        </div>
        <div className="col-12 col-sm-6 col-md-4 col-xl-2">
          <BiKpiCard
            title="Incidencias Críticas"
            value={kpis.incidenciasCriticas}
            icon="fa-solid fa-triangle-exclamation"
            colorVariant="danger"
            subtext="Averías de alta prioridad"
          />
        </div>
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="row g-3 mb-3">
        {/* Monthly Trend (Volumen vs Tiempo) */}
        <div className="col-12 col-xl-8">
          <BiMonthlyTrendChart
            data={dashboardData?.monthlyTrend || []}
            loading={loading}
          />
        </div>
        {/* Status Donut Chart */}
        <div className="col-12 col-xl-4">
          <BiStatusPieChart
            breakdown={dashboardData?.breakdown || { porEstado: [], porPrioridad: [], porTipoTrabajo: [] }}
            loading={loading}
          />
        </div>
      </div>

      <div className="row g-3 mb-3">
        {/* Top Causes */}
        <div className="col-12 col-xl-6">
          <BiCausesChart
            data={dashboardData?.causes || []}
            loading={loading}
          />
        </div>
        {/* Districts Analytics Table */}
        <div className="col-12 col-xl-6">
          <BiDistrictsTable
            data={dashboardData?.districts || []}
            loading={loading}
            onSelectDistrict={handleDistrictSelect}
            selectedDistrict={filters.distrito}
          />
        </div>
      </div>

      {/* Teams Performance Row */}
      <div className="row g-3">
        <div className="col-12">
          <BiTeamsChart
            data={dashboardData?.teams || []}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardBI;
