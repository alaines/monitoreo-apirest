import api from '../lib/api';

export interface DatosGrafico {
  tipo?: string;
  cantidad: number;
  cruce?: string;
  mes?: string;
  estado?: string;
}

export interface DatosTop5Averias {
  tipo: string;
  total: number;
  atendidas: number;
  porAtender: number;
}

export interface DatosConsolidado {
  cruce: string;
  administrador: string;
  tipos: { [key: string]: number };
  total: number;
}

export interface ResumenGrafico {
  totalIncidencias: number;
  totalCruces: number;
  totalTipos: number;
}

export interface ReporteGraficoResponse {
  resumen: ResumenGrafico;
  consolidado: DatosConsolidado[];
  graficos: {
    porTipo: DatosGrafico[];
    porCruce: DatosGrafico[];
    porMes: DatosGrafico[];
    porEstado: DatosGrafico[];
    top5Averias: DatosTop5Averias[];
  };
  tiposIncidencias: string[];
}

export const reportesGraficoService = {
  async getReporteGrafico(filtros: any): Promise<ReporteGraficoResponse> {
    const response = await api.get('/reportes/grafico', { params: filtros });
    return response.data;
  },

  async exportarExcel(filtros: any): Promise<void> {
    const response = await api.get('/reportes/grafico/excel', {
      params: filtros,
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_grafico_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
