import { ValidationError } from '@nestjs/common';

/**
 * Diccionario de nombres de propiedades comunes a nombres legibles en español
 */
const FIELD_NAMES_ES: Record<string, string> = {
  descripcion: 'descripción',
  incidenciaId: 'tipo de incidencia',
  cruceId: 'intersección / semáforo',
  prioridadId: 'prioridad',
  equipoId: 'equipo asignado',
  estadoId: 'estado',
  reportadorId: 'reportador',
  reportadorNombres: 'nombre del reportador',
  reportadorDatoContacto: 'contacto del reportador',
  usuario: 'nombre de usuario',
  password: 'contraseña',
  correo: 'correo electrónico',
  email: 'correo electrónico',
  nombres: 'nombres',
  apellidos: 'apellidos',
  nro_documento: 'número de documento',
  tipo_doc_id: 'tipo de documento',
  grupoId: 'grupo',
  areaId: 'área',
  nombre: 'nombre',
  codigo: 'código',
  observaciones: 'observaciones',
  activo: 'estado activo',
  estado: 'estado',
  telefono: 'teléfono',
  direccion: 'dirección',
  latitud: 'latitud',
  longitud: 'longitud',
  parentId: 'elemento padre',
  tipoVia: 'tipo de vía',
  nroCarriles: 'número de carriles',
  ciclovia: 'ciclovía',
  etapa: 'etapa',
  siglas: 'siglas',
  ejecutado_x_empresa: 'ejecutado por empresa',
  ano_proyecto: 'año del proyecto',
  red: 'red',
  caracteristica: 'característica',
  userId: 'usuario',
  userIds: 'usuarios',
  type: 'tipo',
  title: 'título',
  message: 'mensaje',
};

/**
 * Obtiene el nombre amigable de un campo en español
 */
export function getFriendlyFieldName(property: string): string {
  return FIELD_NAMES_ES[property] || property;
}

/**
 * Traduce un mensaje de restricción individual de class-validator a español
 */
export function translateConstraint(
  constraintType: string,
  property: string,
  rawMessage?: string,
): string {
  const field = getFriendlyFieldName(property);

  switch (constraintType) {
    case 'isNotEmpty':
    case 'isDefined':
      return `El campo "${field}" es obligatorio.`;

    case 'isString':
      return `El campo "${field}" debe ser una cadena de texto.`;

    case 'isInt':
      return `El campo "${field}" debe ser un número entero.`;

    case 'isNumber':
      return `El campo "${field}" debe ser un número.`;

    case 'isBoolean':
      return `El campo "${field}" debe ser un valor booleano (verdadero o falso).`;

    case 'isDate':
      return `El campo "${field}" debe ser una fecha válida.`;

    case 'isDateString':
      return `El campo "${field}" debe ser una fecha válida en formato ISO 8601.`;

    case 'isEmail':
      return `El campo "${field}" debe ser un correo electrónico válido.`;

    case 'isEnum':
      return `El valor del campo "${field}" no es válido. Debe ser uno de los valores permitidos.`;

    case 'minLength': {
      const match = rawMessage?.match(/(\d+)\s+characters/i);
      return match
        ? `El campo "${field}" debe tener al menos ${match[1]} caracteres.`
        : `El campo "${field}" debe tener una longitud mínima válida.`;
    }

    case 'maxLength': {
      const match = rawMessage?.match(/(\d+)\s+characters/i);
      return match
        ? `El campo "${field}" no debe exceder los ${match[1]} caracteres.`
        : `El campo "${field}" excede la longitud máxima permitida.`;
    }

    case 'min': {
      const match = rawMessage?.match(/not be less than\s+(-?\d+(?:\.\d+)?)/i);
      return match
        ? `El campo "${field}" debe ser mayor o igual a ${match[1]}.`
        : `El valor del campo "${field}" es menor al mínimo permitido.`;
    }

    case 'max': {
      const match = rawMessage?.match(/not be greater than\s+(-?\d+(?:\.\d+)?)/i);
      return match
        ? `El campo "${field}" debe ser menor o igual a ${match[1]}.`
        : `El valor del campo "${field}" es mayor al máximo permitido.`;
    }

    case 'isPositive':
      return `El campo "${field}" debe ser un número positivo.`;

    case 'isNegative':
      return `El campo "${field}" debe ser un número negativo.`;

    case 'isArray':
      return `El campo "${field}" debe ser una lista.`;

    case 'arrayNotEmpty':
      return `La lista del campo "${field}" no debe estar vacía.`;

    case 'arrayMinSize': {
      const match = rawMessage?.match(/at least\s+(\d+)\s+elements/i);
      return match
        ? `El campo "${field}" debe contener al menos ${match[1]} elementos.`
        : `El campo "${field}" debe contener el número mínimo de elementos requeridos.`;
    }

    case 'arrayMaxSize': {
      const match = rawMessage?.match(/no more than\s+(\d+)\s+elements/i);
      return match
        ? `El campo "${field}" no debe contener más de ${match[1]} elementos.`
        : `El campo "${field}" contiene más elementos de los permitidos.`;
    }

    case 'isUrl':
      return `El campo "${field}" debe ser una URL válida.`;

    case 'isUuid':
      return `El campo "${field}" debe ser un UUID válido.`;

    case 'isAlphanumeric':
      return `El campo "${field}" solo debe contener letras y números.`;

    case 'isAlpha':
      return `El campo "${field}" solo debe contener letras.`;

    case 'isDecimal':
      return `El campo "${field}" debe ser un número decimal válido.`;

    case 'isPhoneNumber':
      return `El campo "${field}" debe ser un número telefónico válido.`;

    case 'isLatitude':
      return `El campo "${field}" debe ser una latitud válida (entre -90 y 90).`;

    case 'isLongitude':
      return `El campo "${field}" debe ser una longitud válida (entre -180 y 180).`;

    case 'isMilitaryTime':
      return `El campo "${field}" debe ser una hora válida en formato HH:MM.`;

    case 'isJSON':
      return `El campo "${field}" debe ser un JSON válido.`;

    case 'isIn':
      return `El valor del campo "${field}" no es una opción válida.`;

    case 'isNotIn':
      return `El valor del campo "${field}" no está permitido.`;

    case 'matches':
      return `El campo "${field}" no cumple con el formato requerido.`;

    case 'whitelistValidation':
      return `La propiedad "${field}" no está permitida.`;

    default:
      if (rawMessage) {
        return translateFallbackText(rawMessage, property);
      }
      return `El campo "${field}" no es válido.`;
  }
}

/**
 * Traductor de respaldo para cadenas en inglés generadas por class-validator u otros módulos
 */
export function translateFallbackText(text: string, defaultProperty?: string): string {
  if (!text || typeof text !== 'string') return text;

  // Patrones comunes en inglés de class-validator
  if (/should not be empty/i.test(text)) {
    const prop = defaultProperty || text.split(' ')[0] || 'campo';
    return `El campo "${getFriendlyFieldName(prop)}" es obligatorio.`;
  }
  if (/must be a string/i.test(text)) {
    const prop = defaultProperty || text.split(' ')[0] || 'campo';
    return `El campo "${getFriendlyFieldName(prop)}" debe ser una cadena de texto.`;
  }
  if (/must be an integer number/i.test(text)) {
    const prop = defaultProperty || text.split(' ')[0] || 'campo';
    return `El campo "${getFriendlyFieldName(prop)}" debe ser un número entero.`;
  }
  if (/must be a number/i.test(text)) {
    const prop = defaultProperty || text.split(' ')[0] || 'campo';
    return `El campo "${getFriendlyFieldName(prop)}" debe ser un número.`;
  }
  if (/must be a boolean/i.test(text)) {
    const prop = defaultProperty || text.split(' ')[0] || 'campo';
    return `El campo "${getFriendlyFieldName(prop)}" debe ser un valor booleano.`;
  }
  if (/must be an email/i.test(text)) {
    const prop = defaultProperty || text.split(' ')[0] || 'campo';
    return `El campo "${getFriendlyFieldName(prop)}" debe ser un correo electrónico válido.`;
  }
  if (/must be longer than or equal to (\d+) characters/i.test(text)) {
    const match = text.match(/must be longer than or equal to (\d+) characters/i);
    const prop = defaultProperty || text.split(' ')[0] || 'campo';
    return `El campo "${getFriendlyFieldName(prop)}" debe tener al menos ${match ? match[1] : ''} caracteres.`;
  }
  if (/must be shorter than or equal to (\d+) characters/i.test(text)) {
    const match = text.match(/must be shorter than or equal to (\d+) characters/i);
    const prop = defaultProperty || text.split(' ')[0] || 'campo';
    return `El campo "${getFriendlyFieldName(prop)}" no debe exceder los ${match ? match[1] : ''} caracteres.`;
  }
  if (/must be one of the following values/i.test(text)) {
    const prop = defaultProperty || text.split(' ')[0] || 'campo';
    return `El valor del campo "${getFriendlyFieldName(prop)}" no es válido. Debe ser uno de los valores permitidos.`;
  }
  if (/Validation failed \(numeric string is expected\)/i.test(text)) {
    return 'Error de validación: Se esperaba un valor numérico entero.';
  }
  if (/Validation failed/i.test(text)) {
    return 'Error de validación en los datos enviados.';
  }
  if (/not found/i.test(text)) {
    return text.replace(/Ticket with ID (\d+) not found/i, 'Incidencia con ID $1 no encontrada')
               .replace(/with ID (\d+) not found/i, 'con ID $1 no encontrado/a')
               .replace(/Not Found/i, 'Recurso no encontrado');
  }

  return text;
}

/**
 * Convierte una lista recursiva de ValidationError en un arreglo plano de mensajes en español
 */
export function formatValidationErrors(errors: ValidationError[], parentProperty = ''): string[] {
  const messages: string[] = [];

  for (const error of errors) {
    const fullProperty = parentProperty ? `${parentProperty}.${error.property}` : error.property;

    if (error.constraints) {
      for (const [constraintType, rawMessage] of Object.entries(error.constraints)) {
        messages.push(translateConstraint(constraintType, fullProperty, rawMessage));
      }
    }

    if (error.children && error.children.length > 0) {
      messages.push(...formatValidationErrors(error.children, fullProperty));
    }
  }

  return messages;
}
