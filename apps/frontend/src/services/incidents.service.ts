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
  };
  cruce?: {
    id: number;
    nombre?: string;
    codigo?: string;
    latitud?: number;
    longitud?: number;
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
  cruceId?: number;
  descripcion?: string;
  reportadorNombres?: string;
  reportadorDatoContacto?: string;
  latitude: number;
  longitude: number;
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
}

export const incidentsService = new IncidentsService();
