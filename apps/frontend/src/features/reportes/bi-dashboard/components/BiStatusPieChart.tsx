import React from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { BreakdownData } from '../../../../services/bi-dashboard.service';

interface BiStatusPieChartProps {
  breakdown: BreakdownData;
  loading?: boolean;
}

export const BiStatusPieChart: React.FC<BiStatusPieChartProps> = ({ breakdown, loading }) => {
  const statusLabels = breakdown.porEstado.map((e) => e.nombre);
  const statusSeries = breakdown.porEstado.map((e) => e.total);

  // Status color mapping
  const getStatusColor = (name: string) => {
    const n = name.toUpperCase();
    if (n.includes('RESUELTO') || n.includes('ATENDID') || n.includes('CERRAD')) return '#10b981'; // Green
    if (n.includes('PROCESO') || n.includes('ASIGNAD') || n.includes('REASIGNAD')) return '#3b82f6'; // Blue
    if (n.includes('PENDIENTE') || n.includes('REGISTRAD') || n.includes('ABIERTO')) return '#f59e0b'; // Amber
    if (n.includes('CANCELAD') || n.includes('ANULAD') || n.includes('CRITIC')) return '#ef4444'; // Red
    return '#6366f1';
  };

  const statusColors = statusLabels.map(getStatusColor);

  const options: ApexOptions = {
    chart: {
      id: 'bi-chart-status',
      type: 'donut',
      height: 300,
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    labels: statusLabels,
    colors: statusColors.length > 0 ? statusColors : ['#1D546D', '#10b981', '#f59e0b', '#ef4444'],
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      dropShadow: { enabled: false },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '12px',
              fontWeight: 600,
              color: '#64748b',
            },
            value: {
              show: true,
              fontSize: '20px',
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
      itemMargin: { horizontal: 5, vertical: 2 },
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `${val} incidencias`,
      },
    },
    stroke: {
      width: 2,
      colors: ['#ffffff'],
    },
  };

  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
        <h6 className="mb-0 text-dark fw-bold">
          <i className="fa-solid fa-chart-pie text-success me-2"></i>
          Distribución por Estado
        </h6>
        <span className="badge bg-light text-muted border">Flujo de Atención</span>
      </div>
      <div className="card-body p-2 position-relative">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: 300 }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : statusSeries.length === 0 || statusSeries.every((v) => v === 0) ? (
          <div className="d-flex justify-content-center align-items-center text-muted" style={{ height: 300 }}>
            <i className="fa-solid fa-circle-exclamation me-2"></i>
            Sin datos de estados para este rango
          </div>
        ) : (
          <div id="chart-wrapper-bi-status" key={statusSeries.join('-')}>
            <Chart options={options} series={statusSeries} type="donut" height={300} />
          </div>
        )}
      </div>
    </div>
  );
};
