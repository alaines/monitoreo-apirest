import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

export enum NotificationType {
  INCIDENCIA_NUEVA = 'INCIDENCIA_NUEVA',
  INCIDENCIA_ACTUALIZADA = 'INCIDENCIA_ACTUALIZADA',
  INCIDENCIA_ASIGNADA = 'INCIDENCIA_ASIGNADA',
  INCIDENCIA_CERRADA = 'INCIDENCIA_CERRADA',
  COMENTARIO_NUEVO = 'COMENTARIO_NUEVO',
  USUARIO_MENCIONADO = 'USUARIO_MENCIONADO',
  SISTEMA = 'SISTEMA',
}

interface CreateNotificationDto {
  userId: number;
  type: NotificationType | string;
  title: string;
  message: string;
  data?: any;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(dto: CreateNotificationDto) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: dto.userId,
          type: dto.type,
          title: dto.title,
          message: dto.message,
          data: dto.data || {},
        },
      });

      try {
        await this.gateway.sendNotificationToUser(dto.userId, notification as any);
      } catch (e) {
        this.logger.debug('Gateway send failed (continuing): ' + (e as any).message);
      }

      this.logger.log(`Notification created for user ${dto.userId}: ${dto.title}`);
      return notification;
    } catch (error) {
      this.logger.error(`Error creating notification: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async createMultiple(userIds: number[], dto: Omit<CreateNotificationDto, 'userId'>) {
    try {
      const notifications = await Promise.all(
        userIds.map((userId) =>
          this.prisma.notification.create({
            data: {
              userId,
              type: dto.type,
              title: dto.title,
              message: dto.message,
              data: dto.data || {},
            },
          }),
        ),
      );

      try {
        await this.gateway.sendNotificationToUsers(userIds, notifications[0] as any);
      } catch (e) {
        this.logger.debug('Gateway broadcast failed (continuing): ' + (e as any).message);
      }

      this.logger.log(`Notifications created for ${userIds.length} users: ${dto.title}`);
      return notifications;
    } catch (error) {
      this.logger.error(`Error creating multiple notifications: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async findAllByUser(userId: number, limit: number = 50) {
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: limit });
  }

  async findUnreadByUser(userId: number) {
    return this.prisma.notification.findMany({ where: { userId, readAt: null }, orderBy: { createdAt: 'desc' } });
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markAsRead(notificationId: number, userId: number) {
    return this.prisma.notification.updateMany({ where: { id: notificationId, userId }, data: { readAt: new Date() } });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  }

  async delete(notificationId: number, userId: number) {
    return this.prisma.notification.deleteMany({ where: { id: notificationId, userId } });
  }

  async deleteAll(userId: number) {
    return this.prisma.notification.deleteMany({ where: { userId } });
  }

  // Helper notification methods
  async notifyNewIncidencia(
    ticketId: number,
    incidenciaTipo: string,
    cruceNombre: string,
    descripcion: string,
  ) {
    // Obtener todos los usuarios activos
    const activeUsers = await this.prisma.user.findMany({
      where: { estado: true },
      select: { id: true },
    });

    if (activeUsers.length === 0) return;

    const userIds = activeUsers.map((u) => u.id);

    return this.createMultiple(userIds, {
      type: NotificationType.INCIDENCIA_NUEVA,
      title: `🚨 ${incidenciaTipo}`,
      message: `${cruceNombre}: ${descripcion}`,
      data: { ticketId, incidenciaTipo, cruceNombre },
    });
  }

  async notifyIncidenciaUpdated(incidenciaId: number, userIds: number[]) {
    return this.createMultiple(userIds, {
      type: NotificationType.INCIDENCIA_ACTUALIZADA,
      title: 'Incidencia Actualizada',
      message: `Una incidencia ha sido actualizada`,
      data: { incidenciaId },
    });
  }

  async notifyNewComment(incidenciaId: number, userIds: number[], commenterName: string) {
    return this.createMultiple(userIds, {
      type: NotificationType.COMENTARIO_NUEVO,
      title: 'Nuevo Comentario',
      message: `${commenterName} ha comentado en una incidencia`,
      data: { incidenciaId },
    });
  }
}
