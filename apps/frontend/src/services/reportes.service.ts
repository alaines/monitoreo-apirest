import { api } from '../lib/api';

export enum PeriodoReporte {
  DIA = 'DIA',
  MES = 'MES',
  ANIO = 'ANIO',
  PERSONALIZADO = 'PERSONALIZADO'
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
    const response = await api.get('/reportes/incidencias', {
      params: filtros,
    });
    return response.data;
  }

  async getEstadisticas(filtros: FiltrosReporte): Promise<EstadisticasReporte> {
    const response = await api.get('/reportes/incidencias/estadisticas', {
      params: filtros,
    });
    return response.data;
  }

  async exportarExcel(filtros: FiltrosReporte) {
    const response = await api.get('/reportes/incidencias/excel', {
      params: filtros,
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
    const response = await api.get('/reportes/incidencias/pdf', {
      params: filtros,
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
