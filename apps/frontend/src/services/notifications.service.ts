import { api } from '../lib/api';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.18.230:3001/api';

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

class NotificationsService {
  private socket: Socket | null = null;

  async getAll(limit?: number): Promise<Notification[]> {
    const params = limit ? { limit } : {};
    const response = await api.get('/notifications', { params });
    return response.data;
  }

  async getUnread(): Promise<Notification[]> {
    const response = await api.get('/notifications/unread');
    return response.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await api.get<UnreadCount>('/notifications/unread/count');
    return response.data.count;
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

    const WS_URL = import.meta.env.VITE_WS_URL || 'http://192.168.18.230:3001';
    
    this.socket = io(`${WS_URL}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to notifications WebSocket');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from notifications WebSocket:', reason);
    });

    this.socket.on('connect_error', (error) => {
      // Solo mostrar error si es relevante (no timeout inicial)
      if (error.message !== 'websocket error' && error.message !== 'xhr poll error') {
        console.warn('WebSocket connection error:', error.message);
      }
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
