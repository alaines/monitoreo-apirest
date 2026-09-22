import React from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { MonthlyTrendItem } from '../../../../services/bi-dashboard.service';

interface BiMonthlyTrendChartProps {
  data: MonthlyTrendItem[];
  loading?: boolean;
}

export const BiMonthlyTrendChart: React.FC<BiMonthlyTrendChartProps> = ({ data, loading }) => {
  const categories = data.map((d) => d.mesCorto || `M${d.mes}`);
  const seriesTotales = data.map((d) => d.total);
  const seriesResueltos = data.map((d) => d.resueltos);
  const seriesTiempo = data.map((d) => d.tiempoPromedioHoras);

  const series = [
    {
      name: 'Total Incidencias',
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
        columnWidth: '55%',
        borderRadius: 4,
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
        style: { colors: '#64748b', fontSize: '11px', fontWeight: 500 },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: [
      {
        title: {
          text: 'Cantidad de Incidencias',
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
      y: {
        formatter: (val, opts) => {
          if (opts.seriesIndex === 2) {
            return `${val?.toFixed(2)} horas`;
          }
          return `${val} casos`;
        },
      },
    },
  };

  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
        <h6 className="mb-0 text-dark fw-bold">
          <i className="fa-solid fa-chart-line text-primary me-2"></i>
          Evolución Mensual: Volumen vs Tiempo de Respuesta
        </h6>
        <span className="badge bg-light text-muted border">Año actual / Filtro</span>
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
          <div id="chart-wrapper-bi-monthly">
            <Chart options={options} series={series} type="line" height={340} />
          </div>
        )}
      </div>
    </div>
  );
};
