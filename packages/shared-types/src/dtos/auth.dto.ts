export interface LoginDto {
  usuario: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: number;
    usuario: string;
    role: string;
  };
}

export interface RegisterDto {
  usuario: string;
  password: string;
  personaId?: number;
  grupoId: number;
  areaId?: number;
}
