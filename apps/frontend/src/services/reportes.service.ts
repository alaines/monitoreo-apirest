import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export enum PeriodoReporte {
  DIA = 'dia',
  MES = 'mes',
  ANIO = 'anio',
  PERSONALIZADO = 'personalizado'
}

export interface FiltrosReporte {
  fechaInicio?: string;
  fechaFin?: string;
  periodo?: PeriodoReporte;
  mes?: number;
  anio?: number;
  tipoIncidencia?: number;
  estadoId?: number;
  administradorId?: number;
  cruceId?: number;
}

export interface EstadisticasReporte {
  total: number;
  porTipo: Array<{ tipo: string; cantidad: number; porcentaje: string }>;
  porEstado: Array<{ estado: string; cantidad: number; porcentaje: string }>;
  porMes: Array<{ mes: string; cantidad: number }>;
  porAdministrador: Array<{ administrador: string; cantidad: number }>;
}

class ReportesService {
  async getReporteIncidencias(filtros: FiltrosReporte) {
    const response = await axios.get(`${API_URL}/reportes/incidencias`, {
      params: filtros,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  }

  async getEstadisticas(filtros: FiltrosReporte): Promise<EstadisticasReporte> {
    const response = await axios.get(`${API_URL}/reportes/incidencias/estadisticas`, {
      params: filtros,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  }

  async exportarExcel(filtros: FiltrosReporte) {
    const response = await axios.get(`${API_URL}/reportes/incidencias/excel`, {
      params: filtros,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      responseType: 'blob',
    });

    // Crear enlace de descarga
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_incidencias_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async exportarPDF(filtros: FiltrosReporte) {
    const response = await axios.get(`${API_URL}/reportes/incidencias/pdf`, {
      params: filtros,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      responseType: 'blob',
    });

    // Crear enlace de descarga
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_incidencias_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

export const reportesService = new ReportesService();
