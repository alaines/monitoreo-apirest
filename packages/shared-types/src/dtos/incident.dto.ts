import { IncidentSource } from '../enums/incident-source.enum';

export interface CreateIncidentDto {
  incidenciaId: number;
  prioridadId?: number;
  cruceId?: number;
  equipoId?: number;
  descripcion: string;
  reportadorId?: number;
  reportadorNombres?: string;
  reportadorDatoContacto?: string;
  fuente?: IncidentSource;
}

export interface UpdateIncidentDto {
  incidenciaId?: number;
  prioridadId?: number;
  equipoId?: number;
  descripcion?: string;
  estadoId?: number;
}

export interface FilterIncidentDto {
  estadoId?: number;
  prioridadId?: number;
  equipoId?: number;
  cruceId?: number;
  fechaInicio?: Date;
  fechaFin?: Date;
  fuente?: IncidentSource;
}
