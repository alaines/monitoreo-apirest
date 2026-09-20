import api from '../lib/api';

export interface Administrador {
  id: number;
  nombre: string;
  responsable?: string;
  telefono?: number | null;
  email?: string;
  estado?: boolean;
}

class AdministradoresService {
  async getAdministradores(): Promise<Administrador[]> {
    const response = await api.get('/administradores');
    return response.data;
  }

  async getAll(): Promise<Administrador[]> {
    const response = await api.get('/administradores');
    return response.data;
  }

  async getById(id: number): Promise<Administrador> {
    const response = await api.get(`/administradores/${id}`);
    return response.data;
  }

  async create(data: Partial<Administrador>): Promise<Administrador> {
    const response = await api.post('/administradores', data);
    return response.data;
  }

  async update(id: number, data: Partial<Administrador>): Promise<Administrador> {
    const response = await api.patch(`/administradores/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<Administrador> {
    const response = await api.delete(`/administradores/${id}`);
    return response.data;
  }
}

export const administradoresService = new AdministradoresService();
