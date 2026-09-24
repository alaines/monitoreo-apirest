import React from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { TrendItem } from '../../../../services/bi-dashboard.service';

interface BiMonthlyTrendChartProps {
  data: TrendItem[];
  trendType?: 'mensual' | 'diario';
  trendLabel?: string;
  selectedMonth?: number;
  selectedYear?: number;
  mesNombre?: string;
  loading?: boolean;
}

export const BiMonthlyTrendChart: React.FC<BiMonthlyTrendChartProps> = ({
  data,
  trendType = 'mensual',
  trendLabel,
  selectedMonth,
  selectedYear,
  mesNombre,
  loading,
}) => {
  const isDaily = trendType === 'diario' || Boolean(selectedMonth);
  const categories = data.map((d) => d.etiqueta || (d.dia ? String(d.dia).padStart(2, '0') : d.mesCorto || `M${d.mes}`));
  const seriesTotales = data.map((d) => d.total);
  const seriesResueltos = data.map((d) => d.resueltos);
  const seriesTiempo = data.map((d) => d.tiempoPromedioHoras);

  const series = [
    {
      name: 'Total Registros',
      type: 'column',
      data: seriesTotales,
    },
    {
      name: 'Atendidas / Resueltas',
      type: 'column',
      data: seriesResueltos,
    },
    {
      name: 'Tiempo Prom. (Horas)',
      type: 'line',
      data: seriesTiempo,
    },
  ];

  const options: ApexOptions = {
    chart: {
      id: 'bi-chart-monthly-trend',
      type: 'line',
      height: 340,
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
    colors: ['#1D546D', '#10b981', '#f59e0b'],
    stroke: {
      width: [0, 0, 3],
      curve: 'smooth',
    },
    plotOptions: {
      bar: {
        columnWidth: isDaily ? '70%' : '55%',
        borderRadius: isDaily ? 2 : 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
    },
    xaxis: {
      categories,
      labels: {
        rotate: isDaily ? -45 : 0,
        rotateAlways: false,
        hideOverlappingLabels: true,
        style: { colors: '#64748b', fontSize: isDaily ? '10px' : '11px', fontWeight: 500 },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      title: {
        text: isDaily ? 'Día del Mes' : 'Mes',
        style: { color: '#64748b', fontSize: '11px', fontWeight: 600 },
      },
    },
    yaxis: [
      {
        title: {
          text: 'Cantidad de Registros',
          style: { color: '#1D546D', fontSize: '11px', fontWeight: 600 },
        },
        labels: {
          style: { colors: '#64748b', fontSize: '11px' },
          formatter: (val) => Math.floor(val).toString(),
        },
        min: 0,
      },
      {
        opposite: true,
        title: {
          text: 'Tiempo Prom. Atención (Horas)',
          style: { color: '#f59e0b', fontSize: '11px', fontWeight: 600 },
        },
        labels: {
          style: { colors: '#64748b', fontSize: '11px' },
          formatter: (val) => `${val.toFixed(1)}h`,
        },
        min: 0,
      },
    ],
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '12px',
      fontWeight: 500,
      markers: { width: 10, height: 10, radius: 12 },
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: 'light',
      custom: ({ dataPointIndex, w }) => {
        const item = data[dataPointIndex];
        if (!item) return '';
        const title = item.nombreCompleto || item.mesNombre || (isDaily ? `Día ${item.etiqueta}` : item.etiqueta);
        const total = item.total || 0;
        const resueltos = item.resueltos || 0;
        const tiempo = item.tiempoPromedioHoras !== undefined ? item.tiempoPromedioHoras.toFixed(1) : '0.0';

        return `
          <div class="p-2" style="font-size: 12px; min-width: 175px;">
            <div class="fw-bold border-bottom pb-1 mb-2 text-dark">${title}</div>
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="d-inline-flex align-items-center" style="color: #334155;">
                <span style="display:inline-block;width:10px;height:10px;background-color:#1D546D;border-radius:2px;margin-right:6px;flex-shrink:0;"></span>
                Total:
              </span>
              <span class="fw-bold text-dark">${total}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="d-inline-flex align-items-center" style="color: #334155;">
                <span style="display:inline-block;width:10px;height:10px;background-color:#10b981;border-radius:2px;margin-right:6px;flex-shrink:0;"></span>
                Resueltas:
              </span>
              <span class="fw-bold" style="color: #059669;">${resueltos}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center">
              <span class="d-inline-flex align-items-center" style="color: #334155;">
                <span style="display:inline-block;width:10px;height:10px;background-color:#f59e0b;border-radius:50%;margin-right:6px;flex-shrink:0;"></span>
                Tiempo Prom.:
              </span>
              <span class="fw-bold" style="color: #d97706;">${tiempo}h</span>
            </div>
          </div>
        `;
      },
    },
  };

  const badgeText = isDaily
    ? trendLabel || `${mesNombre || `Mes ${selectedMonth}`} ${selectedYear || ''}`
    : trendLabel || `Año ${selectedYear || 'actual'}`;

  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
        <h6 className="mb-0 text-dark fw-bold">
          <i className={`fa-solid ${isDaily ? 'fa-calendar-day' : 'fa-chart-line'} text-primary me-2`}></i>
          {isDaily ? 'Evolución Diaria: Volumen vs Tiempo de Respuesta' : 'Evolución Mensual: Volumen vs Tiempo de Respuesta'}
        </h6>
        <span className={`badge ${isDaily ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-light text-muted border'}`}>
          {badgeText}
        </span>
      </div>
      <div className="card-body p-2 position-relative">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: 340 }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="d-flex justify-content-center align-items-center text-muted" style={{ height: 340 }}>
            <i className="fa-solid fa-circle-exclamation me-2"></i>
            No hay datos disponibles para el período
          </div>
        ) : (
          <div id="chart-wrapper-bi-monthly" key={`${trendType}-${selectedMonth || 0}-${selectedYear || 0}-${data.length}`}>
            <Chart options={options} series={series} type="line" height={340} />
          </div>
        )}
      </div>
    </div>
  );
};

