import api from '../lib/api';

export interface Administrador {
  id: number;
  nombre: string;
  responsable?: string;
  telefono?: number;
  email?: string;
}

class AdministradoresService {
  async getAdministradores(): Promise<Administrador[]> {
    const response = await api.get('/administradores');
    return response.data;
  }
}

export const administradoresService = new AdministradoresService();
