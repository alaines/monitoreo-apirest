import { UserRole } from './enums/roles.enum';

export interface User {
  id: number;
  personaId?: number;
  usuario: string;
  grupoId?: number;
  areaId?: number;
  estado: boolean;
  online?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Persona {
  id: number;
  tipoDocId?: number;
  nroDoc?: string;
  nombres?: string;
  apellidoP?: string;
  apellidoM?: string;
  estadoCivilId?: number;
  direccion?: string;
  telefono?: string;
  email?: string;
}

export interface AuthUser extends User {
  persona?: Persona;
  role: UserRole;
  permissions: string[];
}
