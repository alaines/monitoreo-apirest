export interface Menu {
  id: number;
  nombre: string;
  icono: string;
  ruta: string;
  orden: number;
  menuPadreId: number | null;
  codigo: string;
  submenus?: Menu[];
}

export interface User {
  id: number;
  usuario: string;
  grupoId: number;
  grupo: {
    id: number;
    nombre: string;
    edicion?: boolean | null;
  };
  menus?: Menu[];
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
