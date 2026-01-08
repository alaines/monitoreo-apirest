/**
 * Utilidades para formateo de fechas con soporte de zona horaria
 * 
 * IMPORTANTE: Todas las fechas del backend vienen en UTC.
 * Estas utilidades convierten automáticamente a la hora local del navegador.
 */

/**
 * Formatea una fecha completa con hora (DD/MM/YYYY HH:mm:ss)
 * @param date - Fecha en formato ISO string o objeto Date
 * @returns Fecha formateada en hora local de Perú
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  return new Date(date).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Formatea solo la fecha (DD/MM/YYYY)
 * @param date - Fecha en formato ISO string o objeto Date
 * @returns Fecha formateada en hora local de Perú
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  return new Date(date).toLocaleDateString('es-PE', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * Formatea solo la hora (HH:mm:ss)
 * @param date - Fecha en formato ISO string o objeto Date
 * @returns Hora formateada en hora local de Perú
 */
export const formatTime = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  return new Date(date).toLocaleTimeString('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Formatea fecha/hora corta (DD/MM/YYYY HH:mm)
 * @param date - Fecha en formato ISO string o objeto Date
 * @returns Fecha y hora formateada sin segundos
 */
export const formatDateTimeShort = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  return new Date(date).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formatea fecha relativa (hace X minutos/horas/días)
 * @param date - Fecha en formato ISO string o objeto Date
 * @returns Texto relativo al momento actual
 */
export const formatRelativeTime = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Justo ahora';
  if (diffMins === 1) return 'Hace 1 minuto';
  if (diffMins < 60) return `Hace ${diffMins} minutos`;
  if (diffHours === 1) return 'Hace 1 hora';
  if (diffHours < 24) return `Hace ${diffHours} horas`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  
  return formatDate(date);
};

/**
 * Convierte una fecha local a UTC ISO string para enviar al backend
 * @param date - Fecha en formato local
 * @returns Fecha en formato ISO UTC
 */
export const toUTCString = (date: Date): string => {
  return date.toISOString();
};

/**
 * Obtiene la fecha actual en hora de Lima
 * @returns Objeto Date con la hora actual
 */
export const now = (): Date => {
  return new Date();
};

/**
 * Formatea para input datetime-local (YYYY-MM-DDTHH:mm)
 * Convierte de UTC a hora local para mostrar en formularios
 */
export const toDateTimeLocal = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  
  const d = new Date(date);
  // Ajustar a zona horaria local (Perú: UTC-5)
  const offset = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d.getTime() - offset);
  
  return localDate.toISOString().slice(0, 16);
};

/**
 * Convierte de input datetime-local a Date UTC
 * Para enviar al backend desde formularios
 */
export const fromDateTimeLocal = (dateString: string): Date => {
  if (!dateString) return new Date();
  
  // El string viene en formato local, lo convertimos a UTC
  return new Date(dateString);
};
