import api from '../lib/api';

export interface Tipo {
  id: number;
  parent_id: number | null;
  name: string | null;
  estado: boolean | null;
  lft: number | null;
  rght: number | null;
}

export const tiposService = {
  async getTipos(): Promise<Tipo[]> {
    const response = await api.get('/tipos');
    return response.data;
  },
  async getTipoById(id: number): Promise<Tipo | undefined> {
    const tipos = await tiposService.getTipos();
    return tipos.find(t => t.id === id);
  }
};
