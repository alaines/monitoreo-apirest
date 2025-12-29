import { IncidentSource } from './enums/incident-source.enum';

export interface Incident {
  id: number;
  incidenciaId: number;
  prioridadId?: number;
  cruceId?: number;
  equipoId?: number;
  descripcion?: string;
  estadoId?: number;
  reportadorId?: number;
  reportadorNombres?: string;
  reportadorDatoContacto?: string;
  usuarioRegistra?: string;
  usuarioFinaliza?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IncidentType {
  id: number;
  parentId?: number;
  tipo: string;
  estado: boolean;
  prioridadId?: number;
  caracteristica?: 'I' | 'T'; // I = Incidencia, T = Trabajo
}

export interface IncidentTracking {
  id: number;
  ticketId: number;
  equipoId?: number;
  responsableId?: number;
  reporte?: string;
  estadoId?: number;
  usuarioRegistra?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Priority {
  id: number;
  nombre: string;
  nivel?: number; // 1=Alta, 2=Media, 3=Baja
  color?: string;
  estado?: boolean;
}
