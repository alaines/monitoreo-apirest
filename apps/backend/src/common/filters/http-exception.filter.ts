import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { translateFallbackText } from '../utils/validation-i18n';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Error interno del servidor. Por favor, intente nuevamente más tarde.';
    let errorType = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = translateFallbackText(res);
        errorType = this.getDefaultErrorName(status);
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        errorType = resObj.error || this.getDefaultErrorName(status);

        if (Array.isArray(resObj.message)) {
          message = resObj.message.map((m: any) =>
            typeof m === 'string' ? translateFallbackText(m) : m,
          );
        } else if (typeof resObj.message === 'string') {
          message = translateFallbackText(resObj.message);
        } else {
          message = this.getDefaultSpanishMessage(status);
        }
      }
    } else if (this.isPrismaError(exception)) {
      const prismaError = exception as any;
      switch (prismaError.code) {
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          errorType = 'Conflict';
          const target = Array.isArray(prismaError.meta?.target)
            ? prismaError.meta.target.join(', ')
            : prismaError.meta?.target || 'campo único';
          message = `Ya existe un registro con el mismo valor para: ${target}.`;
          break;
        }
        case 'P2025': {
          status = HttpStatus.NOT_FOUND;
          errorType = 'Not Found';
          message = 'El registro solicitado no fue encontrado en la base de datos.';
          break;
        }
        case 'P2003': {
          status = HttpStatus.BAD_REQUEST;
          errorType = 'Bad Request';
          message = 'No se puede realizar la operación debido a restricciones de relaciones existentes.';
          break;
        }
        case 'P2014': {
          status = HttpStatus.BAD_REQUEST;
          errorType = 'Bad Request';
          message = 'La operación viola una relación obligatoria entre registros.';
          break;
        }
        default: {
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          errorType = 'Database Error';
          message = 'Error en la base de datos al procesar la solicitud.';
          break;
        }
      }
      this.logger.error(`[Prisma ${prismaError.code}] ${prismaError.message}`, prismaError.stack);
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
      message = 'Error interno del servidor. Por favor, intente nuevamente más tarde.';
    }

    // Asegurar mensajes predeterminados en español para códigos de error si el mensaje es genérico en inglés
    if (typeof message === 'string') {
      if (status === HttpStatus.UNAUTHORIZED && (message === 'Unauthorized' || !message)) {
        message = 'No autorizado: Inicie sesión para acceder a este recurso.';
      } else if (status === HttpStatus.FORBIDDEN && (message === 'Forbidden' || message === 'Forbidden resource' || !message)) {
        message = 'Acceso denegado: No cuenta con los permisos necesarios para realizar esta acción.';
      } else if (status === HttpStatus.NOT_FOUND && (message === 'Not Found' || !message || message.startsWith('Cannot '))) {
        message = 'Recurso no encontrado.';
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: errorType,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private isPrismaError(error: any): boolean {
    return (
      error &&
      typeof error === 'object' &&
      (error.constructor?.name === 'PrismaClientKnownRequestError' ||
        typeof error.code === 'string' && error.code.startsWith('P'))
    );
  }

  private getDefaultSpanishMessage(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Solicitud incorrecta o datos no válidos.';
      case HttpStatus.UNAUTHORIZED:
        return 'No autorizado: Inicie sesión para acceder a este recurso.';
      case HttpStatus.FORBIDDEN:
        return 'Acceso denegado: No cuenta con los permisos necesarios.';
      case HttpStatus.NOT_FOUND:
        return 'Recurso no encontrado.';
      case HttpStatus.CONFLICT:
        return 'Conflicto: El registro ya existe o no se puede completar la operación.';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Los datos enviados no pudieron ser procesados.';
      default:
        return 'Ha ocurrido un error al procesar la solicitud.';
    }
  }

  private getDefaultErrorName(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Unprocessable Entity';
      default:
        return 'Internal Server Error';
    }
  }
}
