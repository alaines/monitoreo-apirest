import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Interceptor para auditoría automática de cambios
 * 
 * Registra en la tabla 'auditoria' todas las operaciones de modificación (POST, PUT, PATCH, DELETE)
 * Guarda información sobre:
 * - Acción realizada (crear, actualizar, eliminar)
 * - Tabla afectada
 * - Usuario que realizó la acción
 * - Datos anteriores (para updates y deletes)
 * - Datos nuevos (para creates y updates)
 * - IP del cliente
 * - User-Agent
 * 
 * @example
 * ```typescript
 * // Aplicar a un endpoint específico
 * @UseInterceptors(AuditInterceptor)
 * @Patch(':id')
 * async update(@Param('id') id: number, @Body() dto: UpdateDto) {
 *   return this.service.update(id, dto);
 * }
 * 
 * // Aplicar a todo un controlador
 * @UseInterceptors(AuditInterceptor)
 * @Controller('users')
 * export class UsersController {}
 * ```
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Solo auditar operaciones de modificación
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const user = request.user;
    const body = request.body;
    const route = request.route?.path || request.url;
    const ip = request.ip || request.connection?.remoteAddress;
    const userAgent = request.headers['user-agent'];

    // Extraer el nombre de la tabla desde la ruta
    const tabla = this.extractTableFromRoute(route);
    const accion = this.mapMethodToAction(method);

    // Guardar datos antes de ejecutar la operación
    const datosAnteriores = method === 'PUT' || method === 'PATCH' || method === 'DELETE' 
      ? body 
      : null;

    return next.handle().pipe(
      tap(async (response) => {
        try {
          // Solo crear auditoría si hay un usuario autenticado
          if (!user || !user.id) {
            return;
          }

          const userId = user.id || user.sub;
          const recordId = this.extractRecordId(response, request);

          // Crear registro de auditoría
          await this.prisma.auditoria.create({
            data: {
              accion,
              tabla,
              registroId: recordId,
              datosAnteriores: datosAnteriores ? JSON.parse(JSON.stringify(datosAnteriores)) : null,
              datosNuevos: response ? JSON.parse(JSON.stringify(response)) : null,
              usuarioId: userId,
              ip: ip || null,
              userAgent: userAgent || null,
            },
          });
        } catch (error) {
          // No fallar la request si la auditoría falla, solo loguear
          console.error('Error al crear registro de auditoría:', error);
        }
      }),
    );
  }

  /**
   * Extrae el nombre de la tabla desde la ruta del endpoint
   * Ejemplos:
   * - /api/users/:id -> users
   * - /api/cruces -> cruces
   * - /api/tickets/assign -> tickets
   */
  private extractTableFromRoute(route: string): string {
    const parts = route.split('/').filter(p => p && p !== 'api');
    return parts[0] || 'unknown';
  }

  /**
   * Mapea el método HTTP a una acción legible
   */
  private mapMethodToAction(method: string): string {
    const actionMap: Record<string, string> = {
      'POST': 'crear',
      'PUT': 'actualizar',
      'PATCH': 'actualizar',
      'DELETE': 'eliminar',
    };
    return actionMap[method] || method.toLowerCase();
  }

  /**
   * Extrae el ID del registro afectado
   * - Para creates: desde el response.id
   * - Para updates/deletes: desde los params de la ruta
   */
  private extractRecordId(response: any, request: any): number | null {
    // Intentar obtener desde el response
    if (response && response.id) {
      return typeof response.id === 'number' ? response.id : parseInt(response.id);
    }

    // Intentar obtener desde los params
    if (request.params && request.params.id) {
      const id = parseInt(request.params.id);
      return isNaN(id) ? null : id;
    }

    return null;
  }
}
