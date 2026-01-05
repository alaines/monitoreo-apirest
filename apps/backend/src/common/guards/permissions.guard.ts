import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, IS_PUBLIC_KEY } from '../decorators/permissions.decorator';
import { PermisosService } from '../../permisos/permisos.service';

interface PermissionRequirement {
  menuCodigo?: string;
  accionCodigo?: string;
  any?: Array<{ menuCodigo: string; accionCodigo: string }>;
  all?: Array<{ menuCodigo: string; accionCodigo: string }>;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permisosService: PermisosService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar si el endpoint es público
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Obtener los permisos requeridos del decorador
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionRequirement>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay permisos requeridos, permitir acceso (solo autenticación)
    if (!requiredPermissions) {
      return true;
    }

    // Obtener usuario del request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    // Extraer el ID del usuario (puede ser 'id' o 'sub' según el JWT)
    const userId = user.id || user.sub;

    if (!userId) {
      throw new UnauthorizedException('ID de usuario no válido');
    }

    // Caso 1: Permiso simple
    if (requiredPermissions.menuCodigo && requiredPermissions.accionCodigo) {
      const hasPermission = await this.permisosService.verificarPermiso(
        userId,
        requiredPermissions.menuCodigo,
        requiredPermissions.accionCodigo,
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `No tiene permiso para realizar esta acción (${requiredPermissions.accionCodigo}) en ${requiredPermissions.menuCodigo}`,
        );
      }

      return true;
    }

    // Caso 2: Requiere AL MENOS UNO de varios permisos
    if (requiredPermissions.any) {
      const permissionsChecks = await Promise.all(
        requiredPermissions.any.map((perm: any) =>
          this.permisosService.verificarPermiso(
            userId,
            perm.menuCodigo,
            perm.accionCodigo,
          ),
        ),
      );

      const hasAnyPermission = permissionsChecks.some((check: boolean) => check === true);

      if (!hasAnyPermission) {
        throw new ForbiddenException(
          'No tiene ninguno de los permisos requeridos para esta acción',
        );
      }

      return true;
    }

    // Caso 3: Requiere TODOS los permisos
    if (requiredPermissions.all) {
      const permissionsChecks = await Promise.all(
        requiredPermissions.all.map((perm: any) =>
          this.permisosService.verificarPermiso(
            userId,
            perm.menuCodigo,
            perm.accionCodigo,
          ),
        ),
      );

      const hasAllPermissions = permissionsChecks.every((check: boolean) => check === true);

      if (!hasAllPermissions) {
        throw new ForbiddenException(
          'No tiene todos los permisos requeridos para esta acción',
        );
      }

      return true;
    }

    return true;
  }
}
