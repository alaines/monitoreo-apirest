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
    origin: [
      'http://localhost:5173',
      'http://192.168.18.230:5173',
      'http://apps.movingenia.com',
      'https://apps.movingenia.com',
    ],
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
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');

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

      await this.prisma.userSession.create({
        data: {
          userId: userId,
          socketId: client.id,
          ipAddress: client.handshake.address,
          userAgent: client.handshake.headers['user-agent'] as string,
          connectedAt: new Date(),
          lastActivity: new Date(),
          isActive: true,
        },
      });

      client.join(`user:${userId}`);

      await this.prisma.user.update({ where: { id: client.userId }, data: { online: true } });

      this.logger.log(`Client connected: ${client.id} (User: ${client.userId})`);

      await this.sendUnreadNotifications(client);
    } catch (error) {
      this.logger.error(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    try {
      if (!client.userId) return;

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

      this.logger.log(`Client disconnected: ${client.id} (User: ${client.userId})`);
    } catch (error) {
      this.logger.error(`Disconnect error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  @SubscribeMessage('ping')
  async handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    if (client.userId) {
      await this.prisma.userSession.updateMany({ 
        where: { socketId: client.id, isActive: true }, 
        data: { lastActivity: new Date() } 
      });
    }
    return { event: 'pong', data: { timestamp: new Date() } };
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { notificationId: number }) {
    try {
      await this.prisma.notification.updateMany({ 
        where: { id: data.notificationId, userId: client.userId }, 
        data: { readAt: new Date() } 
      });
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
      await this.prisma.notification.updateMany({ 
        where: { userId: client.userId, readAt: null }, 
        data: { readAt: new Date() } 
      });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Mark all as read error: ${message}`);
      return { success: false, error: message };
    }
  }

  async sendNotificationToUser(userId: number, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  async sendNotificationToUsers(userIds: number[], notification: any) {
    userIds.forEach((userId) => {
      this.server.to(`user:${userId}`).emit('notification', notification);
    });
  }

  async broadcastNotification(notification: any) {
    this.server.emit('notification', notification);
  }

  // Broadcast incident creation to all connected clients
  async broadcastIncidentCreated(incident: any) {
    this.server.emit('incidentCreated', incident);
    this.logger.debug(`Broadcasted new incident: ${incident.id}`);
  }

  // Broadcast incident update to all connected clients
  async broadcastIncidentUpdated(incident: any) {
    this.server.emit('incidentUpdated', incident);
    this.logger.debug(`Broadcasted incident update: ${incident.id}`);
  }

  private async sendUnreadNotifications(client: AuthenticatedSocket) {
    const unreadNotifications = await this.prisma.notification.findMany({ 
      where: { userId: client.userId, readAt: null }, 
      orderBy: { createdAt: 'desc' }, 
      take: 50 
    });

    if (unreadNotifications.length > 0) {
      client.emit('unreadNotifications', { 
        count: unreadNotifications.length, 
        notifications: unreadNotifications 
      });
    }
  }
}
