export interface User {
  id: number;
  usuario: string;
  grupoId: number;
  grupo: {
    id: number;
    nombre: string;
  };
}

export interface LoginCredentials {
  usuario: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
