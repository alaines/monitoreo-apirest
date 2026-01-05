import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorador para requerir permisos específicos en un endpoint
 * @param menuCodigo - Código del menú (ej: 'tickets', 'usuarios')
 * @param accionCodigo - Código de la acción (ej: 'view', 'create', 'edit', 'delete')
 * 
 * @example
 * @RequirePermission('tickets', 'create')
 * @Post()
 * async createTicket() { ... }
 */
export const RequirePermission = (menuCodigo: string, accionCodigo: string) =>
  SetMetadata(PERMISSIONS_KEY, { menuCodigo, accionCodigo });

/**
 * Decorador para requerir múltiples permisos (el usuario debe tener AL MENOS UNO)
 * @param permissions - Array de permisos [{menuCodigo, accionCodigo}]
 * 
 * @example
 * @RequireAnyPermission([
 *   { menuCodigo: 'tickets', accionCodigo: 'edit' },
 *   { menuCodigo: 'tickets', accionCodigo: 'delete' }
 * ])
 */
export const RequireAnyPermission = (
  permissions: Array<{ menuCodigo: string; accionCodigo: string }>,
) => SetMetadata(PERMISSIONS_KEY, { any: permissions });

/**
 * Decorador para requerir múltiples permisos (el usuario debe tener TODOS)
 * @param permissions - Array de permisos [{menuCodigo, accionCodigo}]
 * 
 * @example
 * @RequireAllPermissions([
 *   { menuCodigo: 'tickets', accionCodigo: 'view' },
 *   { menuCodigo: 'cruces', accionCodigo: 'view' }
 * ])
 */
export const RequireAllPermissions = (
  permissions: Array<{ menuCodigo: string; accionCodigo: string }>,
) => SetMetadata(PERMISSIONS_KEY, { all: permissions });

/**
 * Decorador para endpoints públicos (no requieren autenticación ni permisos)
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
