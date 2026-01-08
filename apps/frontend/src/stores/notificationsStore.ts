import { create } from 'zustand';
import { Notification } from '../services/notifications.service';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  activeToast: Notification | null;
  
  setNotifications: (notifications: Notification[]) => void;
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
  unreadCount: 0,
  isConnected: false,
  activeToast: null,

  setNotifications: (notifications) => set({ notifications }),

  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1,
  })),

  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, readAt: new Date().toISOString() } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({
      ...n,
      readAt: n.readAt || new Date().toISOString(),
    })),
    unreadCount: 0,
  })),

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
    unreadCount: state.notifications.find((n) => n.id === id && !n.readAt)
      ? Math.max(0, state.unreadCount - 1)
      : state.unreadCount,
  })),

  setUnreadCount: (count) => set({ unreadCount: count }),

  setConnected: (connected) => set({ isConnected: connected }),

  showToast: (notification) => set({ activeToast: notification }),

  hideToast: () => set({ activeToast: null }),
}));
