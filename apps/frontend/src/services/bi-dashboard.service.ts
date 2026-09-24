import { api } from '../lib/api';

export interface QueryBiDashboardDto {
  anho?: number;
  mes?: number;
  distrito?: string;
  administradorId?: number;
  equipoId?: number;
  prioridadId?: number;
  caracteristica?: string;
}

export interface BiFilterOptions {
  years: number[];
  months: Array<{ id: number; name: string; shortName: string }>;
  administradores: Array<{ id: number; nombre: string }>;
  equipos: Array<{ id: number; nombre: string }>;
  distritos: string[];
}

export interface ExecutiveKpis {
  totalIncidencias: number;
  incidenciasAtendidas: number;
  incidenciasPendientes: number;
  incidenciasEnProceso: number;
  tasaResolucion: number;
  interseccionesAfectadas: number;
  interseccionesAtendidas: number;
  tiempoPromedioHoras: number;
  tiempoPromedioDias: number;
  incidenciasCriticas: number;
}

export interface TrendItem {
  periodo: number; // 1..12 (mes) o 1..31 (dia)
  dia?: number;
  mes?: number;
  mesNombre?: string;
  mesCorto?: string;
  etiqueta: string;
  nombreCompleto?: string;
  total: number;
  incidencias: number;
  mantenimientos: number;
  resueltos: number;
  tiempoPromedioHoras: number;
}

export type MonthlyTrendItem = TrendItem;

export interface CauseItem {
  id: number;
  nombre: string;
  caracteristica: string;
  prioridadId: number;
  esCritica: boolean;
  total: number;
  porcentaje: number;
}

export interface DistrictItem {
  distrito: string;
  total: number;
  crucesAfectados: number;
  resueltos: number;
  tasaResolucion: number;
  porcentajeTotal: number;
}

export interface TeamWorkloadItem {
  equipoId: number;
  equipoNombre: string;
  total: number;
  resueltos: number;
  tasaResolucion: number;
  tiempoPromedioHoras: number;
}

export interface BreakdownData {
  porEstado: Array<{ estadoId: number; nombre: string; total: number }>;
  porPrioridad: Array<{ prioridadId: number; nombre: string; total: number }>;
  porTipoTrabajo: Array<{ tipo: string; caracteristica: string; total: number }>;
}

export interface FullBiDashboardData {
  kpis: ExecutiveKpis;
  trendType: 'mensual' | 'diario';
  trendLabel: string;
  monthlyTrend: TrendItem[];
  trend: TrendItem[];
  causes: CauseItem[];
  districts: DistrictItem[];
  teams: TeamWorkloadItem[];
  breakdown: BreakdownData;
}

class BiDashboardService {
  async getFilterOptions(): Promise<BiFilterOptions> {
    const response = await api.get('/reportes/bi-dashboard/filters');
    return response.data;
  }

  async getDashboardData(query?: QueryBiDashboardDto): Promise<FullBiDashboardData> {
    const response = await api.get('/reportes/bi-dashboard/data', { params: query });
    return response.data;
  }

  async getKpis(query?: QueryBiDashboardDto): Promise<ExecutiveKpis> {
    const response = await api.get('/reportes/bi-dashboard/kpis', { params: query });
    return response.data;
  }

  async getMonthlyTrend(query?: QueryBiDashboardDto): Promise<TrendItem[]> {
    const response = await api.get('/reportes/bi-dashboard/monthly-trend', { params: query });
    return response.data;
  }

  async getCauses(query?: QueryBiDashboardDto): Promise<CauseItem[]> {
    const response = await api.get('/reportes/bi-dashboard/causes', { params: query });
    return response.data;
  }

  async getDistricts(query?: QueryBiDashboardDto): Promise<DistrictItem[]> {
    const response = await api.get('/reportes/bi-dashboard/districts', { params: query });
    return response.data;
  }

  async getTeams(query?: QueryBiDashboardDto): Promise<TeamWorkloadItem[]> {
    const response = await api.get('/reportes/bi-dashboard/teams', { params: query });
    return response.data;
  }
}

export const biDashboardService = new BiDashboardService();

