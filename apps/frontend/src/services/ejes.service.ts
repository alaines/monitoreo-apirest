import api from '../lib/api';

export interface Eje {
  id: number;
  nombreVia: string;
  tipoVia?: number | null;
  nroCarriles?: number | null;
  ciclovia?: boolean | null;
  observaciones?: string | null;
}

export const ejesService = {
  async getEjes(): Promise<Eje[]> {
    const response = await api.get('/ejes');
    return response.data;
  },

  async getAll(): Promise<Eje[]> {
    const response = await api.get('/ejes');
    return response.data;
  },

  async getEje(id: number): Promise<Eje> {
    const response = await api.get(`/ejes/${id}`);
    return response.data;
  },

  async getById(id: number): Promise<Eje> {
    const response = await api.get(`/ejes/${id}`);
    return response.data;
  },

  async create(data: Partial<Eje>): Promise<Eje> {
    const response = await api.post('/ejes', data);
    return response.data;
  },

  async update(id: number, data: Partial<Eje>): Promise<Eje> {
    const response = await api.patch(`/ejes/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/ejes/${id}`);
  },
};
