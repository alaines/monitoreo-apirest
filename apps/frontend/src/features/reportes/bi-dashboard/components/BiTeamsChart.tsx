import React from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { TeamWorkloadItem } from '../../../../services/bi-dashboard.service';

interface BiTeamsChartProps {
  data: TeamWorkloadItem[];
  loading?: boolean;
}

export const BiTeamsChart: React.FC<BiTeamsChartProps> = ({ data, loading }) => {
  const categories = data.map((d) => d.equipoNombre);
  const totalSeries = data.map((d) => d.total);
  const resueltosSeries = data.map((d) => d.resueltos);

  const series = [
    {
      name: 'Asignadas',
      data: totalSeries,
    },
    {
      name: 'Resueltas / Cerradas',
      data: resueltosSeries,
    },
  ];

  const options: ApexOptions = {
    chart: {
      id: 'bi-chart-teams',
      type: 'bar',
      height: 300,
      toolbar: { show: false },
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
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
    colors: ['#3b82f6', '#10b981'],
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
      categories,
      labels: {
        style: { colors: '#334155', fontSize: '11px', fontWeight: 500 },
        rotate: -15,
        trim: true,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: {
        text: 'Cant. Tareas',
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
      fontSize: '11px',
      markers: { width: 8, height: 8, radius: 12 },
    },
    fill: {
      opacity: 0.95,
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val, opts) => {
          const item = data[opts.dataPointIndex];
          if (item && opts.seriesIndex === 1) {
            return `${val} resueltas (${item.tasaResolucion}% de efectividad)`;
          }
          return `${val} asignadas`;
        },
      },
    },
  };

  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
        <h6 className="mb-0 text-dark fw-bold">
          <i className="fa-solid fa-users-gear text-info me-2"></i>
          Rendimiento por Equipo / Cuadrilla
        </h6>
        <span className="badge bg-light text-muted border">Asignadas vs Resueltas</span>
      </div>
      <div className="card-body p-2 position-relative">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: 300 }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="d-flex justify-content-center align-items-center text-muted" style={{ height: 300 }}>
            <i className="fa-solid fa-circle-exclamation me-2"></i>
            Sin asignaciones a cuadrillas registradas
          </div>
        ) : (
          <div id="chart-wrapper-bi-teams">
            <Chart options={options} series={series} type="bar" height={300} />
          </div>
        )}
      </div>
    </div>
  );
};
