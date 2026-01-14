import { api } from '../lib/api';

export interface Incident {
  id: number;
  incidenciaId: number;
  prioridadId?: number;
  cruceId?: number;
  equipoId?: number;
  estadoId?: number;
  descripcion?: string;
  reportadorNombres?: string;
  reportadorDatoContacto?: string;
  usuarioRegistra?: string;
  usuarioFinaliza?: string;
  createdAt: string;
  updatedAt?: string;
  latitude?: number;
  longitude?: number;
  incidencia?: {
    id: number;
    tipo: string;
    prioridad?: {
      id: number;
      nombre: string;
    };
  };
  cruce?: {
    id: number;
    nombre?: string;
    codigo?: string;
    latitud?: number;
    longitud?: number;
    electricoEmpresa?: string;
    electricoSuministro?: string;
    administrador?: {
      id: number;
      nombre: string;
    };
  };
  equipo?: {
    id: number;
    nombre: string;
  };
  reportador?: {
    id: number;
    nombre: string;
  };
}

export interface CreateIncidentDto {
  incidenciaId: number;
  prioridadId?: number;
  cruceId: number; // Obligatorio - las coordenadas se heredan del cruce
  descripcion?: string;
  reportadorNombres?: string;
  reportadorDatoContacto?: string;
}

export interface UpdateIncidentDto extends Partial<CreateIncidentDto> {
  estadoId?: number;
  equipoId?: number;
}

export interface QueryIncidentsDto {
  page?: number;
  limit?: number;
  estadoId?: number;
  incidenciaId?: number;
  equipoId?: number;
  administradorId?: number;
  anho?: number;
  year?: number;
  month?: number;
  search?: string;
}

export interface IncidentsResponse {
  data: Incident[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IncidentStatistics {
  total: number;
  byEstado: Array<{
    estadoId: number;
    count: number;
  }>;
}

export interface IncidenciaCatalog {
  id: number;
  tipo: string;
  caracteristica?: string;
  prioridadeId?: number;
}

export interface PrioridadCatalog {
  id: number;
  nombre: string;
}

export interface EstadoCatalog {
  id: number;
  nombre: string;
}

export interface CruceCatalog {
  id: number;
  nombre: string;
}

export interface EquipoCatalog {
  id: number;
  nombre: string;
}

export interface ResponsableCatalog {
  id: number;
  nombre: string;
  equipoId: number;
}

export interface ReportadorCatalog {
  id: number;
  nombre: string;
}

export interface IncidentTracking {
  id: number;
  ticketId: number;
  equipoId?: number;
  responsableId?: number;
  reporte?: string;
  estadoId?: number;
  createdAt: string;
  usuarioRegistra?: string;
  estado?: {
    id: number;
    nombre: string;
  };
  equipo?: {
    id: number;
    nombre: string;
  };
  responsable?: {
    id: number;
    nombre: string;
  };
}

export interface CreateTrackingDto {
  equipoId?: number;
  responsableId?: number;
  reporte: string;
  estadoId?: number;
}

class IncidentsService {
  async getIncidents(query?: QueryIncidentsDto): Promise<IncidentsResponse> {
    const response = await api.get('/incidents', { params: query });
    return response.data;
  }

  async getIncident(id: number): Promise<Incident> {
    const response = await api.get(`/incidents/${id}`);
    return response.data;
  }

  async createIncident(data: CreateIncidentDto): Promise<Incident> {
    const response = await api.post('/incidents', data);
    return response.data;
  }

  async updateIncident(id: number, data: UpdateIncidentDto): Promise<Incident> {
    const response = await api.patch(`/incidents/${id}`, data);
    return response.data;
  }

  async deleteIncident(id: number): Promise<void> {
    await api.delete(`/incidents/${id}`);
  }

  async getStatistics(): Promise<IncidentStatistics> {
    const response = await api.get('/incidents/statistics');
    return response.data;
  }

  async getAvailableYears(): Promise<number[]> {
    const response = await api.get('/incidents/available-years');
    return response.data;
  }

  async getCrucesApagadosCount(): Promise<{ count: number }> {
    const response = await api.get('/incidents/cruces-apagados/count');
    return response.data;
  }

  async getMapMarkers(query?: QueryIncidentsDto): Promise<IncidentsResponse> {
    const response = await api.get('/incidents/map-markers', { params: query });
    return response.data;
  }

  async getIncidenciasCatalog(): Promise<IncidenciaCatalog[]> {
    const response = await api.get('/incidents/catalogs/incidencias');
    return response.data;
  }

  async getPrioridadesCatalog(): Promise<PrioridadCatalog[]> {
    const response = await api.get('/incidents/catalogs/prioridades');
    return response.data;
  }

  async getEstadosCatalog(): Promise<EstadoCatalog[]> {
    const response = await api.get('/incidents/catalogs/estados');
    return response.data;
  }

  async getCrucesCatalog(): Promise<CruceCatalog[]> {
    const response = await api.get('/incidents/catalogs/cruces');
    return response.data;
  }

  async getEquiposCatalog(): Promise<EquipoCatalog[]> {
    const response = await api.get('/incidents/catalogs/equipos');
    return response.data;
  }

  async getResponsablesCatalog(equipoId?: number): Promise<ResponsableCatalog[]> {
    const endpoint = equipoId 
      ? `/responsables/equipo/${equipoId}` 
      : '/responsables';
    const response = await api.get(endpoint);
    return response.data;
  }

  async getReportadoresCatalog(): Promise<ReportadorCatalog[]> {
    const response = await api.get('/incidents/catalogs/reportadores');
    return response.data;
  }

  async getTrackings(incidentId: number): Promise<IncidentTracking[]> {
    const response = await api.get(`/incidents/${incidentId}/trackings`);
    return response.data;
  }

  async createTracking(incidentId: number, data: CreateTrackingDto): Promise<IncidentTracking> {
    const response = await api.post(`/incidents/${incidentId}/trackings`, data);
    return response.data;
  }
}

export const incidentsService = new IncidentsService();
