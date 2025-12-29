export enum IncidentStatus {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  RESUELTO = 'RESUELTO',
  CERRADO = 'CERRADO',
  CANCELADO = 'CANCELADO',
}

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  [IncidentStatus.PENDIENTE]: 'Pendiente',
  [IncidentStatus.EN_PROCESO]: 'En Proceso',
  [IncidentStatus.RESUELTO]: 'Resuelto',
  [IncidentStatus.CERRADO]: 'Cerrado',
  [IncidentStatus.CANCELADO]: 'Cancelado',
};

export const INCIDENT_STATUS_COLORS: Record<IncidentStatus, string> = {
  [IncidentStatus.PENDIENTE]: 'yellow',
  [IncidentStatus.EN_PROCESO]: 'blue',
  [IncidentStatus.RESUELTO]: 'green',
  [IncidentStatus.CERRADO]: 'gray',
  [IncidentStatus.CANCELADO]: 'red',
};
