import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

export enum NotificationType {
  ALERTA_CRITICA = 'ALERTA_CRITICA',
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
        this.logger.debug('Gateway send failed: ' + (e as any).message);
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
      if (!userIds || userIds.length === 0) return [];

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
        this.logger.debug('Gateway broadcast failed: ' + (e as any).message);
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
    return this.prisma.notification.updateMany({ 
      where: { id: notificationId, userId }, 
      data: { readAt: new Date(), isRead: true } 
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({ 
      where: { userId, readAt: null }, 
      data: { readAt: new Date(), isRead: true } 
    });
  }

  async delete(notificationId: number, userId: number) {
    return this.prisma.notification.deleteMany({ where: { id: notificationId, userId } });
  }

  async deleteAll(userId: number) {
    return this.prisma.notification.deleteMany({ where: { userId } });
  }

  // Obtener alertas de tickets críticos activos: IDs 22, 3, 64, 65, 66
  async getActiveCriticalAlerts(limit: number = 20) {
    const CRITICAL_INCIDENT_IDS = [22, 3, 64, 65, 66];
    
    const tickets = await this.prisma.ticket.findMany({
      where: {
        incidenciaId: { in: CRITICAL_INCIDENT_IDS },
        estadoId: { in: [1, 2, 5] }, // Pendiente, En Proceso, Observado
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        incidencia: {
          select: { id: true, tipo: true, caracteristica: true },
        },
        cruce: {
          select: { id: true, nombre: true, codigo: true },
        },
        estado: {
          select: { id: true, nombre: true },
        },
      },
    });

    return tickets.map((t) => ({
      id: t.id,
      ticketId: t.id,
      type: NotificationType.ALERTA_CRITICA,
      title: t.incidencia?.tipo || 'Alerta Crítica',
      message: `${t.cruce?.nombre || `Cruce #${t.cruceId}`}: ${t.descripcion || 'Incidencia crítica activa'}`,
      data: {
        ticketId: t.id,
        isCritical: true,
        incidenciaId: t.incidenciaId,
        incidenciaTipo: t.incidencia?.tipo,
        cruceId: t.cruceId,
        cruceNombre: t.cruce?.nombre,
        estadoId: t.estadoId,
        estadoNombre: t.estado?.nombre,
      },
      link: `/incidents/${t.id}`,
      readAt: null,
      createdAt: t.createdAt,
    }));
  }

  // Helper notification methods
  async notifyNewIncidencia(
    ticketId: number,
    incidenciaTipo: string,
    cruceNombre: string,
    descripcion: string,
    isCritical: boolean = false,
  ) {
    const activeUsers = await this.prisma.user.findMany({
      where: { estado: true },
      select: { id: true },
    });

    if (activeUsers.length === 0) return;
    const userIds = activeUsers.map((u) => u.id);

    const type = isCritical ? NotificationType.ALERTA_CRITICA : NotificationType.INCIDENCIA_NUEVA;

    return this.createMultiple(userIds, {
      type,
      title: incidenciaTipo,
      message: `${cruceNombre}: ${descripcion || 'Nueva incidencia registrada'}`,
      data: { ticketId, isCritical, incidenciaTipo, cruceNombre },
    });
  }

  async notifyIncidenciaUpdated(ticketId: number, cruceNombre: string, detalle: string) {
    const activeUsers = await this.prisma.user.findMany({
      where: { estado: true },
      select: { id: true },
    });

    if (activeUsers.length === 0) return;
    const userIds = activeUsers.map((u) => u.id);

    return this.createMultiple(userIds, {
      type: NotificationType.INCIDENCIA_ACTUALIZADA,
      title: `Ticket #${ticketId} Actualizado`,
      message: `${cruceNombre}: ${detalle}`,
      data: { ticketId, cruceNombre },
    });
  }

  async notifyStatusChange(ticketId: number, cruceNombre: string, estadoNombre: string, usuario: string) {
    const activeUsers = await this.prisma.user.findMany({
      where: { estado: true },
      select: { id: true },
    });

    if (activeUsers.length === 0) return;
    const userIds = activeUsers.map((u) => u.id);

    const isResolved = estadoNombre.toLowerCase().includes('resuelt') || estadoNombre.toLowerCase().includes('cerrad');
    return this.createMultiple(userIds, {
      type: isResolved ? NotificationType.INCIDENCIA_CERRADA : NotificationType.INCIDENCIA_ACTUALIZADA,
      title: `Ticket #${ticketId} - ${estadoNombre}`,
      message: `${cruceNombre} por ${usuario}`,
      data: { ticketId, cruceNombre, estadoNombre },
    });
  }
}
