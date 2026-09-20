import { create } from 'zustand';
import { Notification } from '../services/notifications.service';

interface NotificationsState {
  notifications: Notification[];
  criticalAlerts: Notification[];
  unreadCount: number;
  isConnected: boolean;
  activeToast: Notification | null;
  
  setNotifications: (notifications: Notification[]) => void;
  setCriticalAlerts: (alerts: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  removeNotification: (id: number) => void;
  setUnreadCount: (count: number) => void;
  setConnected: (connected: boolean) => void;
  showToast: (notification: Notification) => void;
  hideToast: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  criticalAlerts: [],
  unreadCount: 0,
  isConnected: false,
  activeToast: null,

  setNotifications: (notifications) => set({ notifications }),

  setCriticalAlerts: (criticalAlerts) => set({ criticalAlerts }),

  addNotification: (notification) => set((state) => {
    const isCritical = notification.data?.isCritical || 
      notification.type === 'ALERTA_CRITICA' || 
      (notification.data?.incidenciaId && [22, 3, 64, 65, 66].includes(notification.data.incidenciaId));

    const updatedCritical = isCritical
      ? [notification, ...state.criticalAlerts.filter(a => (a.data?.ticketId || a.id) !== (notification.data?.ticketId || notification.id))]
      : state.criticalAlerts;

    return {
      notifications: [notification, ...state.notifications],
      criticalAlerts: updatedCritical,
      unreadCount: state.unreadCount + 1,
    };
  }),

  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, readAt: new Date().toISOString() } : n
    ),
    criticalAlerts: state.criticalAlerts.map((n) =>
      n.id === id ? { ...n, readAt: new Date().toISOString() } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({
      ...n,
      readAt: n.readAt || new Date().toISOString(),
    })),
    criticalAlerts: state.criticalAlerts.map((n) => ({
      ...n,
      readAt: n.readAt || new Date().toISOString(),
    })),
    unreadCount: 0,
  })),

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
    criticalAlerts: state.criticalAlerts.filter((n) => n.id !== id),
    unreadCount: state.notifications.find((n) => n.id === id && !n.readAt)
      ? Math.max(0, state.unreadCount - 1)
      : state.unreadCount,
  })),

  setUnreadCount: (count) => set({ unreadCount: count }),

  setConnected: (connected) => set({ isConnected: connected }),

  showToast: (notification) => set({ activeToast: notification }),

  hideToast: () => set({ activeToast: null }),
}));
