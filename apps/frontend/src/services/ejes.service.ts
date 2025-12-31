import api from '../lib/api';

export interface Eje {
  id: number;
  nombreVia: string;
  tipoVia?: number;
  nroCarriles?: number;
  ciclovia?: boolean;
  observaciones?: string;
}

export const ejesService = {
  async getEjes(): Promise<Eje[]> {
    const response = await api.get('/ejes');
    return response.data;
  },

  async getEje(id: number): Promise<Eje> {
    const response = await api.get(`/ejes/${id}`);
    return response.data;
  },
};
