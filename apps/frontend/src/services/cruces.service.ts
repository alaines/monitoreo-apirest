import api from '../lib/api';

export interface Cruce {
  id: number;
  ubigeoId: string;
  tipoGestion: number;
  administradorId?: number;
  proyectoId: number;
  via1: number;
  via2: number;
  tipoComunicacion?: number;
  estado?: boolean;
  tipoCruce?: number;
  tipoEstructura?: number;
  planoPdf?: string;
  planoDwg?: string;
  tipoOperacion?: string;
  anoImplementacion?: number;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
  nombre: string;
  latitud: number;
  longitud: number;
  codigo?: string;
  tipoControl?: number;
  codigoAnterior?: string;
  usuarioRegistra?: string;
  electricoEmpresa?: string;
  electricoSuministro?: string;
  ubigeo?: any;
  proyecto?: any;
  administrador?: any;
  crucesPerifericos?: CrucePeriferico[];
}

export interface Periferico {
  id: number;
  tipoPeriferico: number;
  fabricante?: string;
  modelo?: string;
  ip?: string;
  numeroSerie?: string;
  usuario?: string;
  password?: string;
  enGarantia?: boolean;
  estado?: string;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
  usuario_registra?: string;
  crucesPerifericos?: CrucePeriferico[];
}

export interface CrucePeriferico {
  id: number;
  cruceId: number;
  perifericoId: number;
  createdAt?: string;
  updatedAt?: string;
  cruce?: Cruce;
  periferico?: Periferico;
}

export interface QueryCrucesParams {
  page?: number;
  limit?: number;
  search?: string;
  codigo?: string;
  estado?: boolean;
  ubigeoId?: string;
  proyectoId?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface QueryPerifericosParams {
  page?: number;
  limit?: number;
  search?: string;
  tipoPeriferico?: number;
  estado?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const crucesService = {
  async getCruces(params?: QueryCrucesParams) {
    const response = await api.get('/cruces', { params });
    return response.data;
  },

  async getCruce(id: number) {
    const response = await api.get(`/cruces/${id}`);
    return response.data;
  },

  async createCruce(data: Partial<Cruce>) {
    const response = await api.post('/cruces', data);
    return response.data;
  },

  async updateCruce(id: number, data: Partial<Cruce>) {
    const response = await api.patch(`/cruces/${id}`, data);
    return response.data;
  },

  async deleteCruce(id: number) {
    const response = await api.delete(`/cruces/${id}`);
    return response.data;
  },

  async searchCruces(query: string, limit?: number) {
    const response = await api.get('/cruces/search', { 
      params: { q: query, limit } 
    });
    return response.data;
  },

  async getPerifericos(cruceId: number) {
    const response = await api.get(`/cruces/${cruceId}/perifericos`);
    return response.data;
  },

  async addPeriferico(cruceId: number, perifericoId: number) {
    const response = await api.post(`/cruces/${cruceId}/perifericos`, { perifericoId });
    return response.data;
  },

  async removePeriferico(cruceId: number, perifericoId: number) {
    const response = await api.delete(`/cruces/${cruceId}/perifericos/${perifericoId}`);
    return response.data;
  },
};

export const perifericosService = {
  async getPerifericos(params?: QueryPerifericosParams) {
    const response = await api.get('/perifericos', { params });
    return response.data;
  },

  async getPeriferico(id: number) {
    const response = await api.get(`/perifericos/${id}`);
    return response.data;
  },

  async createPeriferico(data: Partial<Periferico>) {
    const response = await api.post('/perifericos', data);
    return response.data;
  },

  async updatePeriferico(id: number, data: Partial<Periferico>) {
    const response = await api.patch(`/perifericos/${id}`, data);
    return response.data;
  },

  async deletePeriferico(id: number) {
    const response = await api.delete(`/perifericos/${id}`);
    return response.data;
  },
};
