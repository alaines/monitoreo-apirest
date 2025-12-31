import api from '../lib/api';

export interface Ubigeo {
  id: string;
  region: string;
  provincia: string;
  distrito: string;
}

class UbigeosService {
  async getUbigeos(): Promise<Ubigeo[]> {
    const response = await api.get('/ubigeos');
    return response.data;
  }
}

export const ubigeosService = new UbigeosService();
