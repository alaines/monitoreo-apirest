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
  caracteristica?: string;
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

  async getReporte(filtros: FiltrosReporte): Promise<EstadisticasReporte> {
    return this.getEstadisticas(filtros);
  }

  async exportarExcel(filtros: FiltrosReporte) {
    const response = await api.get('/reportes/incidencias/excel', {
      params: filtros,
      responseType: 'blob',
    });

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    
    let filename = `reporte_incidencias_${timestamp}.xlsx`;
    const contentDisposition = response.headers?.['content-disposition'];
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    // Crear enlace de descarga
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
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

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    let filename = `reporte_incidencias_${timestamp}.pdf`;
    const contentDisposition = response.headers?.['content-disposition'];
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    // Crear enlace de descarga
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

export const reportesService = new ReportesService();
