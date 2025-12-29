export enum IncidentSource {
  WAZE = 'WAZE',
  LLAMADA = 'LLAMADA',
  WHATSAPP = 'WHATSAPP',
  CAMPO = 'CAMPO',
}

export const INCIDENT_SOURCE_LABELS: Record<IncidentSource, string> = {
  [IncidentSource.WAZE]: 'Waze for Cities',
  [IncidentSource.LLAMADA]: 'Llamada Telefónica',
  [IncidentSource.WHATSAPP]: 'WhatsApp',
  [IncidentSource.CAMPO]: 'Personal de Campo',
};
