import React from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { CauseItem } from '../../../../services/bi-dashboard.service';

interface BiCausesChartProps {
  data: CauseItem[];
  loading?: boolean;
}

export const BiCausesChart: React.FC<BiCausesChartProps> = ({ data, loading }) => {
  const top10 = data.slice(0, 10);
  const categories = top10.map((d) => d.nombre);
  const values = top10.map((d) => d.total);
  const colors = top10.map((d) => (d.esCritica ? '#ef4444' : '#1D546D'));

  const series = [
    {
      name: 'Incidencias',
      data: values,
    },
  ];

  const options: ApexOptions = {
    chart: {
      id: 'bi-chart-causes',
      type: 'bar',
      height: 340,
      toolbar: { show: false },
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    colors: colors.length > 0 ? colors : ['#1D546D'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: '65%',
        distributed: true,
      },
    },
    dataLabels: {
      enabled: true,
      textAnchor: 'start',
      style: {
        colors: ['#1e293b'],
        fontSize: '11px',
        fontWeight: 600,
      },
      formatter: (val, opt) => {
        const item = top10[opt.dataPointIndex];
        return `${val} (${item ? item.porcentaje : 0}%)`;
      },
      offsetX: 5,
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
    },
    xaxis: {
      categories,
      labels: {
        style: { colors: '#64748b', fontSize: '11px' },
      },
    },
    yaxis: {
      labels: {
        style: { colors: '#334155', fontSize: '11px', fontWeight: 500 },
        maxWidth: 220,
      },
    },
    legend: {
      show: false,
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val, opt) => {
          const item = top10[opt.dataPointIndex];
          return `${val} incidencias (${item ? item.porcentaje : 0}% del total)`;
        },
      },
    },
  };

  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
        <h6 className="mb-0 text-dark fw-bold">
          <i className="fa-solid fa-triangle-exclamation text-danger me-2"></i>
          Top Causas y Tipos de Incidencias
        </h6>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle small">
            <i className="fa-solid fa-circle me-1" style={{ fontSize: '8px' }}></i> Críticas
          </span>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle small">
            <i className="fa-solid fa-circle me-1" style={{ fontSize: '8px' }}></i> Estándar
          </span>
        </div>
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
            No se registraron incidencias en este período
          </div>
        ) : (
          <div id="chart-wrapper-bi-causes" key={data.map((d) => `${d.id}-${d.total}`).join('-')}>
            <Chart options={options} series={series} type="bar" height={340} />
          </div>
        )}
      </div>
    </div>
  );
};
