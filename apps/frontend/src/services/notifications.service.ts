import { api } from '../lib/api';
import { io, Socket } from 'socket.io-client';

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  link?: string;
  readAt: string | null;
  createdAt: string;
}

export interface UnreadCount {
  count: number;
}

function getWsBaseUrl(): string {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      return 'http://localhost:3000';
    }
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }
  return 'http://localhost:3000';
}

class NotificationsService {
  private socket: Socket | null = null;

  async getAll(limit: number = 50): Promise<Notification[]> {
    try {
      const response = await api.get('/notifications', { params: { limit } });
      return response.data || [];
    } catch (e) {
      console.error('Error fetching all notifications:', e);
      return [];
    }
  }

  async getUnread(): Promise<Notification[]> {
    try {
      const response = await api.get('/notifications/unread');
      return response.data || [];
    } catch (e) {
      console.error('Error fetching unread notifications:', e);
      return [];
    }
  }

  async getCriticalAlerts(limit: number = 20): Promise<Notification[]> {
    try {
      const response = await api.get('/notifications/critical-alerts', { params: { limit } });
      return response.data || [];
    } catch (e) {
      console.error('Error fetching critical alerts:', e);
      return [];
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get<UnreadCount>('/notifications/unread/count');
      return response.data?.count ?? 0;
    } catch (e) {
      console.error('Error fetching unread count:', e);
      return 0;
    }
  }

  async markAsRead(id: number): Promise<Notification> {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/read-all');
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/notifications/${id}`);
  }

  async deleteAll(): Promise<void> {
    await api.delete('/notifications');
  }

  // WebSocket
  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    const WS_URL = getWsBaseUrl();
    
    this.socket = io(`${WS_URL}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 15,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to notifications WebSocket on', `${WS_URL}/notifications`);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from notifications WebSocket:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('WebSocket connection attempt error:', error.message);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Emitir ping periódico para mantener la conexión
  ping(): void {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }
}

export const notificationsService = new NotificationsService();
