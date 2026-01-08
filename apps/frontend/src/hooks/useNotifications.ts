import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../features/auth/authStore';
import { useNotificationsStore } from '../stores/notificationsStore';
import { notificationsService, Notification } from '../services/notifications.service';

export function useNotifications() {
  const { token } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isConnected,
    setNotifications,
    addNotification,
    markAsRead: markAsReadStore,
    markAllAsRead: markAllAsReadStore,
    removeNotification,
    setUnreadCount,
    setConnected,
    showToast,
  } = useNotificationsStore();

  const socketRef = useRef(notificationsService.getSocket());
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Conectar WebSocket
  useEffect(() => {
    if (!token) {
      notificationsService.disconnect();
      setConnected(false);
      return;
    }

    const socket = notificationsService.connect(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      loadInitialData();
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('notification', (notification: Notification) => {
      console.log('📬 Nueva notificación recibida:', notification);
      addNotification(notification);
      showToast(notification);
      
      // Reproducir sonido de notificación
      playNotificationSound();
    });

    socket.on('incidentCreated', (incident: any) => {
      console.log('🆕 Nueva incidencia creada:', incident);
      // Emitir evento global para que los componentes se actualicen
      window.dispatchEvent(new CustomEvent('incidentCreated', { detail: incident }));
    });

    socket.on('incidentUpdated', (incident: any) => {
      console.log('🔄 Incidencia actualizada:', incident);
      // Emitir evento global para que los componentes se actualicen
      window.dispatchEvent(new CustomEvent('incidentUpdated', { detail: incident }));
    });

    socket.on('unreadCount', (data: { count: number }) => {
      setUnreadCount(data.count);
    });

    // Ping cada 30 segundos para mantener la conexión
    pingIntervalRef.current = setInterval(() => {
      notificationsService.ping();
    }, 30000);

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      notificationsService.disconnect();
      setConnected(false);
    };
  }, [token]);

  const loadInitialData = useCallback(async () => {
    try {
      const [notifs, count] = await Promise.all([
        notificationsService.getAll(50),
        notificationsService.getUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await notificationsService.markAsRead(id);
      markAsReadStore(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [markAsReadStore]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsService.markAllAsRead();
      markAllAsReadStore();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [markAllAsReadStore]);

  const deleteNotification = useCallback(async (id: number) => {
    try {
      await notificationsService.delete(id);
      removeNotification(id);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [removeNotification]);

  const deleteAll = useCallback(async () => {
    try {
      await notificationsService.deleteAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  }, [setNotifications, setUnreadCount]);

  const playNotificationSound = () => {
    // Sonido simple usando Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll,
    refresh: loadInitialData,
  };
}
