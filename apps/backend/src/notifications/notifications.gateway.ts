import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  user?: any;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('✅ Notifications WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      if (!userId) {
        client.disconnect();
        return;
      }

      client.userId = userId;
      client.user = payload;

      try {
        await this.prisma.userSession.create({
          data: {
            userId: userId,
            socketId: client.id,
            ipAddress: client.handshake.address || '127.0.0.1',
            userAgent: (client.handshake.headers['user-agent'] as string) || 'unknown',
            connectedAt: new Date(),
            lastActivity: new Date(),
            isActive: true,
          },
        });
      } catch (sessionError) {
        this.logger.debug(`Session create skipped: ${(sessionError as Error).message}`);
      }

      client.join(`user:${userId}`);

      try {
        await this.prisma.user.update({ where: { id: client.userId }, data: { online: true } });
      } catch (userError) {
        this.logger.debug(`User online update skipped: ${(userError as Error).message}`);
      }

      this.logger.log(`🟢 Client connected: ${client.id} (User: ${client.userId})`);

      await this.sendUnreadNotifications(client);
    } catch (error) {
      this.logger.error(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    try {
      if (!client.userId) return;

      try {
        await this.prisma.userSession.updateMany({ 
          where: { socketId: client.id, isActive: true }, 
          data: { disconnectedAt: new Date(), isActive: false } 
        });

        const activeSessions = await this.prisma.userSession.count({ 
          where: { userId: client.userId, isActive: true } 
        });

        if (activeSessions === 0) {
          await this.prisma.user.update({ where: { id: client.userId }, data: { online: false } });
        }
      } catch (disconnectDbError) {
        this.logger.debug(`Disconnect DB cleanup skipped: ${(disconnectDbError as Error).message}`);
      }

      this.logger.log(`🔴 Client disconnected: ${client.id} (User: ${client.userId})`);
    } catch (error) {
      this.logger.error(`Disconnect error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  @SubscribeMessage('ping')
  async handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    if (client.userId) {
      try {
        await this.prisma.userSession.updateMany({ 
          where: { socketId: client.id, isActive: true }, 
          data: { lastActivity: new Date() } 
        });
      } catch (e) {}
    }
    client.emit('pong', { timestamp: new Date() });
    return { event: 'pong', data: { timestamp: new Date() } };
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { notificationId: number }) {
    try {
      if (client.userId && data.notificationId) {
        await this.prisma.notification.updateMany({ 
          where: { id: data.notificationId, userId: client.userId }, 
          data: { readAt: new Date(), isRead: true } 
        });
        const unreadCount = await this.prisma.notification.count({ where: { userId: client.userId, readAt: null } });
        client.emit('unreadCount', { count: unreadCount });
      }
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Mark as read error: ${message}`);
      return { success: false, error: message };
    }
  }

  @SubscribeMessage('markAllAsRead')
  async handleMarkAllAsRead(@ConnectedSocket() client: AuthenticatedSocket) {
    try {
      if (client.userId) {
        await this.prisma.notification.updateMany({ 
          where: { userId: client.userId, readAt: null }, 
          data: { readAt: new Date(), isRead: true } 
        });
        client.emit('unreadCount', { count: 0 });
      }
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Mark all as read error: ${message}`);
      return { success: false, error: message };
    }
  }

  async sendNotificationToUser(userId: number, notification: any) {
    if (this.server) {
      this.server.to(`user:${userId}`).emit('notification', notification);
      try {
        const count = await this.prisma.notification.count({ where: { userId, readAt: null } });
        this.server.to(`user:${userId}`).emit('unreadCount', { count });
      } catch (e) {}
    }
  }

  async sendNotificationToUsers(userIds: number[], notification: any) {
    if (this.server) {
      for (const userId of userIds) {
        this.server.to(`user:${userId}`).emit('notification', notification);
        try {
          const count = await this.prisma.notification.count({ where: { userId, readAt: null } });
          this.server.to(`user:${userId}`).emit('unreadCount', { count });
        } catch (e) {}
      }
    }
  }

  async broadcastNotification(notification: any) {
    if (this.server) {
      this.server.emit('notification', notification);
    }
  }

  // Broadcast incident creation to all connected clients
  async broadcastIncidentCreated(incident: any) {
    if (this.server) {
      this.server.emit('incidentCreated', incident);
      this.logger.log(`Broadcasted new incident: ${incident.id}`);
    }
  }

  // Broadcast incident update to all connected clients
  async broadcastIncidentUpdated(incident: any) {
    if (this.server) {
      this.server.emit('incidentUpdated', incident);
      this.logger.log(`Broadcasted incident update: ${incident.id}`);
    }
  }

  private async sendUnreadNotifications(client: AuthenticatedSocket) {
    try {
      const unreadNotifications = await this.prisma.notification.findMany({ 
        where: { userId: client.userId, readAt: null }, 
        orderBy: { createdAt: 'desc' }, 
        take: 50 
      });

      client.emit('unreadNotifications', { 
        count: unreadNotifications.length, 
        notifications: unreadNotifications 
      });
      client.emit('unreadCount', { count: unreadNotifications.length });
    } catch (e) {
      this.logger.error(`Failed to send unread notifications: ${(e as Error).message}`);
    }
  }
}
