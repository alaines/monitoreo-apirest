import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ApexCharts from 'apexcharts';

import { PageHeader } from '../../../components/ui/PageHeader';
import { LOGO_MUNILIMA_COLOR } from '../../../assets/logoMunilimaBase64';
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
      const pageWidth = 210;

      const drawHeader = (pageNum: number) => {
        // Institutional top banner
        doc.setFillColor(29, 84, 109);
        doc.rect(0, 0, pageWidth, pageNum === 1 ? 4 : 2.5, 'F');

        if (pageNum === 1) {
          doc.setTextColor(29, 84, 109);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('DASHBOARD EJECUTIVO DE GESTIÓN Y MONITOREO', 14, 13);

          doc.setTextColor(51, 65, 85);
          doc.setFontSize(9.5);
          doc.setFont('helvetica', 'bold');
          doc.text('Subgerencia de Gestión y Fiscalización - SGF', 14, 18.5);

          doc.setTextColor(95, 149, 152);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text('División de Monitoreo y Control Semafórico', 14, 23.5);

          if (LOGO_MUNILIMA_COLOR) {
            doc.addImage(LOGO_MUNILIMA_COLOR, 'PNG', 144, 7, 52, 21.5);
          }

          doc.setDrawColor(29, 84, 109);
          doc.setLineWidth(0.5);
          doc.line(14, 29, 196, 29);
        } else {
          doc.setTextColor(29, 84, 109);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('DASHBOARD EJECUTIVO BI - MONITOREO SEMAFÓRICO', 14, 9);

          doc.setTextColor(100, 116, 139);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(`Año: ${filters.anho || 'Todos'} | Filtro: ${filters.distrito || 'Todos los distritos'}`, 196, 9, { align: 'right' });

          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.line(14, 12, 196, 12);
        }
      };

      // Page 1: Header + Meta + KPIs + Monthly Trend + Status Pie
      drawHeader(1);

      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'bold');
      doc.text('Período:', 14, 35);
      doc.setFont('helvetica', 'normal');
      doc.text(`Año ${filters.anho || 'Todos'}${filters.mes ? ` / Mes ${filters.mes}` : ''}`, 30, 35);

      doc.setFont('helvetica', 'bold');
      doc.text('Distrito:', 80, 35);
      doc.setFont('helvetica', 'normal');
      doc.text(filters.distrito || 'Todos los Distritos', 95, 35);

      doc.setFont('helvetica', 'bold');
      doc.text('Fecha Emisión:', 145, 35);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date().toLocaleString('es-PE'), 168, 35);

      // KPI boxes
      const kpis = dashboardData.kpis;
      const kpiItems = [
        { label: 'TOTAL INCIDENCIAS', val: kpis.totalIncidencias.toLocaleString(), color: [29, 84, 109] },
        { label: 'ATENDIDAS', val: kpis.incidenciasAtendidas.toLocaleString(), color: [16, 185, 129] },
        { label: '% RESOLUCIÓN', val: `${kpis.tasaResolucion}%`, color: [16, 185, 129] },
        { label: 'INTERSECCIONES', val: kpis.interseccionesAfectadas.toLocaleString(), color: [6, 182, 212] },
        { label: 'TIEMPO ATENCIÓN', val: `${kpis.tiempoPromedioHoras}h (${kpis.tiempoPromedioDias}d)`, color: [245, 158, 11] },
        { label: 'CRÍTICAS', val: kpis.incidenciasCriticas.toLocaleString(), color: [239, 68, 68] },
      ];

      kpiItems.forEach((kpi, idx) => {
        const x = 14 + (idx % 3) * 62;
        const y = 40 + Math.floor(idx / 3) * 16;
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, y, 58, 13, 1.5, 1.5, 'F');
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.label, x + 3, y + 4.5);
        doc.setFontSize(10.5);
        doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.text(kpi.val, x + 3, y + 10.5);
      });

      let currentY = 76;

      // Chart 1: Monthly Trend
      const imgMonthly = await getChartImageUri('bi-chart-monthly-trend');
      if (imgMonthly) {
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(29, 84, 109);
        doc.text('1. Evolución Mensual: Volumen de Incidencias vs Tiempo de Atención', 14, currentY);
        currentY += 3;
        doc.addImage(imgMonthly, 'PNG', 14, currentY, 182, 65);
        currentY += 70;
      }

      // Chart 2: Status & Causes
      const imgStatus = await getChartImageUri('bi-chart-status');
      const imgCauses = await getChartImageUri('bi-chart-causes');

      if (imgStatus && imgCauses) {
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(29, 84, 109);
        doc.text('2. Distribución por Estado y Principales Causas', 14, currentY);
        currentY += 3;
        doc.addImage(imgStatus, 'PNG', 14, currentY, 88, 65);
        doc.addImage(imgCauses, 'PNG', 106, currentY, 90, 65);
        currentY += 70;
      }

      // Page 2: Teams Chart + Districts Table
      doc.addPage();
      drawHeader(2);
      let page2Y = 18;

      const imgTeams = await getChartImageUri('bi-chart-teams');
      if (imgTeams) {
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(29, 84, 109);
        doc.text('3. Desempeño y Carga de Trabajo por Cuadrilla / Equipo', 14, page2Y);
        page2Y += 3;
        doc.addImage(imgTeams, 'PNG', 14, page2Y, 182, 65);
        page2Y += 72;
      }

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(29, 84, 109);
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
        startY: page2Y,
        head: [['Distrito', 'Incidencias', '% Total', 'Cruces', 'Resueltas', '% Resolución']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [29, 84, 109], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      });

      // Footers
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(14, 285, 196, 285);
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text('Municipalidad Metropolitana de Lima - SGF', 14, 290);
        doc.text(`Página ${p} de ${totalPages}`, 105, 290, { align: 'center' });
        doc.text(new Date().toLocaleDateString('es-PE'), 196, 290, { align: 'right' });
      }

      const fileName = `Dashboard_Ejecutivo_BI_${filters.anho || 'General'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.dismiss(toastId);
      toast.success('Reporte Ejecutivo PDF generado exitosamente');
    } catch (err) {
      toast.dismiss(toastId);
      console.error('Error al exportar PDF BI:', err);
      toast.error('Error al generar el PDF del Dashboard');
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
