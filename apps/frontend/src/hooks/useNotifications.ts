import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../features/auth/authStore';
import { useNotificationsStore } from '../stores/notificationsStore';
import { notificationsService, Notification } from '../services/notifications.service';

export function useNotifications() {
  const { token: storeToken } = useAuthStore();
  const effectiveToken = storeToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

  const {
    notifications,
    criticalAlerts,
    unreadCount,
    isConnected,
    setNotifications,
    setCriticalAlerts,
    addNotification,
    markAsRead: markAsReadStore,
    markAllAsRead: markAllAsReadStore,
    removeNotification,
    setUnreadCount,
    setConnected,
    showToast,
  } = useNotificationsStore();

  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadInitialData = useCallback(async () => {
    try {
      const [notifs, count, critical] = await Promise.all([
        notificationsService.getAll(50),
        notificationsService.getUnreadCount(),
        notificationsService.getCriticalAlerts(20),
      ]);
      setNotifications(Array.isArray(notifs) ? notifs : []);
      setUnreadCount(typeof count === 'number' ? count : 0);
      setCriticalAlerts(Array.isArray(critical) ? critical : []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [setNotifications, setUnreadCount, setCriticalAlerts]);

  // Cargar datos iniciales al montar si hay token
  useEffect(() => {
    if (effectiveToken) {
      loadInitialData();
    }
  }, [effectiveToken, loadInitialData]);

  // Conectar WebSocket
  useEffect(() => {
    if (!effectiveToken) {
      notificationsService.disconnect();
      setConnected(false);
      return;
    }

    const socket = notificationsService.connect(effectiveToken);

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
      playNotificationSound();
    });

    socket.on('unreadNotifications', (data: { count: number; notifications: Notification[] }) => {
      if (data && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setUnreadCount(data.count ?? data.notifications.length);
      }
    });

    socket.on('incidentCreated', (incident: any) => {
      console.log('🆕 Nueva incidencia creada:', incident);
      window.dispatchEvent(new CustomEvent('incidentCreated', { detail: incident }));
      loadInitialData();
    });

    socket.on('incidentUpdated', (incident: any) => {
      console.log('🔄 Incidencia actualizada:', incident);
      window.dispatchEvent(new CustomEvent('incidentUpdated', { detail: incident }));
      loadInitialData();
    });

    socket.on('unreadCount', (data: { count: number }) => {
      if (data && typeof data.count === 'number') {
        setUnreadCount(data.count);
      }
    });

    // Ping cada 25 segundos para mantener la conexión
    pingIntervalRef.current = setInterval(() => {
      notificationsService.ping();
    }, 25000);

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      socket.off('connect');
      socket.off('disconnect');
      socket.off('notification');
      socket.off('unreadNotifications');
      socket.off('incidentCreated');
      socket.off('incidentUpdated');
      socket.off('unreadCount');
    };
  }, [effectiveToken, addNotification, loadInitialData, setConnected, setNotifications, setUnreadCount, showToast]);

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
      setCriticalAlerts([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  }, [setNotifications, setCriticalAlerts, setUnreadCount]);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.25);
    } catch (error) {
      // Ignorar si el audio está bloqueado por el navegador
    }
  };

  return {
    notifications,
    criticalAlerts,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll,
    refresh: loadInitialData,
  };
}
