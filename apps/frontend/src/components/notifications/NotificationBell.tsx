import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { Notification } from '../../services/notifications.service';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

// Eliminar cualquier emoji o caracter decorativo que venga en títulos o mensajes del backend
function cleanText(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
    .trim();
}

function safeFormatTime(dateStr?: string | null): string {
  if (!dateStr) return 'Reciente';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Reciente';
    return formatDistanceToNow(d, { addSuffix: true, locale: es });
  } catch {
    return 'Reciente';
  }
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { 
    notifications = [], 
    criticalAlerts = [], 
    unreadCount = 0, 
    isConnected = false, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    deleteAll,
    refresh
  } = useNotifications();

  const [showDropdown, setShowDropdown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const safeCriticalAlerts = Array.isArray(criticalAlerts) ? criticalAlerts : [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (typeof refresh === 'function') {
      await refresh();
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleTicketClick = (ticketId: number | string) => {
    navigate(`/incidents/${ticketId}`);
    setShowDropdown(false);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification) return;
    if (!notification.readAt && typeof markAsRead === 'function') {
      await markAsRead(notification.id);
    }
    
    const ticketId = notification.data?.ticketId || notification.ticketId || (notification as any).ticket_id;
    if (ticketId) {
      navigate(`/incidents/${ticketId}`);
      setShowDropdown(false);
    } else if (notification.link) {
      navigate(notification.link);
      setShowDropdown(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (typeof markAllAsRead === 'function') {
      await markAllAsRead();
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (typeof deleteNotification === 'function') {
      await deleteNotification(id);
    }
  };

  const handleClearAll = async () => {
    if (confirm('¿Desea limpiar todas las notificaciones?')) {
      if (typeof deleteAll === 'function') {
        await deleteAll();
      }
    }
  };

  // Determinar icono de FontAwesome 6 y colores según el tipo o contenido
  const getNotificationVisuals = (type: string, title?: string) => {
    const t = ((type || '') + ' ' + (title || '')).toUpperCase();
    if (t.includes('CRITIC') || t.includes('ALERTA') || t.includes('EMERGENCY') || t.includes('APAGAD')) {
      return {
        icon: 'fa-solid fa-triangle-exclamation',
        bgColor: '#fee2e2',
        color: '#dc2626',
      };
    }
    if (t.includes('SEMAFORO') || t.includes('CRUCE') || t.includes('INTERMITENTE')) {
      return {
        icon: 'fa-solid fa-traffic-light',
        bgColor: '#fee2e2',
        color: '#dc2626',
      };
    }
    if (t.includes('NUEVA') || t.includes('NEW') || t.includes('CREAT')) {
      return {
        icon: 'fa-solid fa-bolt',
        bgColor: '#fef3c7',
        color: '#d97706',
      };
    }
    if (t.includes('CERRADA') || t.includes('RESOLVED') || t.includes('DONE') || t.includes('EXITO')) {
      return {
        icon: 'fa-solid fa-circle-check',
        bgColor: '#dcfce7',
        color: '#16a34a',
      };
    }
    if (t.includes('ASIGNADA') || t.includes('ASSIGN') || t.includes('USER') || t.includes('USUARIO')) {
      return {
        icon: 'fa-solid fa-user-check',
        bgColor: '#f3e8ff',
        color: '#7c3aed',
      };
    }
    if (t.includes('ACTUALIZADA') || t.includes('UPDATE') || t.includes('STATUS') || t.includes('CAMBIO')) {
      return {
        icon: 'fa-solid fa-arrows-rotate',
        bgColor: '#e0f2fe',
        color: '#0284c7',
      };
    }
    if (t.includes('REPORTE') || t.includes('REPORT') || t.includes('CHART') || t.includes('ESTADISTICA')) {
      return {
        icon: 'fa-solid fa-chart-column',
        bgColor: '#fef9c3',
        color: '#ca8a04',
      };
    }
    return {
      icon: 'fa-solid fa-bell',
      bgColor: '#f1f5f9',
      color: '#64748b',
    };
  };

  // Agrupación de notificaciones por fecha (HOY, AYER, ANTERIORES)
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: Notification[] } = {
      today: [],
      yesterday: [],
      older: []
    };

    if (!Array.isArray(safeNotifications)) {
      return groups;
    }

    safeNotifications.forEach(n => {
      if (!n) return;
      try {
        if (!n.createdAt) {
          groups.older.push(n);
          return;
        }
        const date = new Date(n.createdAt);
        if (isNaN(date.getTime())) {
          groups.older.push(n);
          return;
        }
        if (isToday(date)) {
          groups.today.push(n);
        } else if (isYesterday(date)) {
          groups.yesterday.push(n);
        } else {
          groups.older.push(n);
        }
      } catch {
        groups.older.push(n);
      }
    });

    return groups;
  }, [safeNotifications]);

  const totalBadgeCount = safeCriticalAlerts.length > 0 
    ? safeCriticalAlerts.length 
    : (typeof unreadCount === 'number' ? unreadCount : 0);
  const totalItemsCount = safeCriticalAlerts.length + safeNotifications.length;

  // Renderizador de un item individual de notificación
  const renderNotificationItem = (notification: Notification) => {
    if (!notification) return null;
    const isUnread = !notification.readAt;
    const cleanedTitle = cleanText(notification.title) || 'Notificación del Sistema';
    const visuals = getNotificationVisuals(notification.type, cleanedTitle);
    const ticketId = notification.data?.ticketId || notification.ticketId || (notification as any).ticket_id;
    const cruceNombre = cleanText(notification.data?.cruceNombre || notification.message || '');
    const timeAgo = safeFormatTime(notification.createdAt);

    return (
      <div
        key={notification.id}
        onClick={() => handleNotificationClick(notification)}
        className="notification-item-card"
        style={{
          cursor: 'pointer',
          padding: '12px 16px',
          margin: '4px 12px 6px',
          borderRadius: '10px',
          backgroundColor: isUnread ? '#f8fafc' : '#ffffff',
          border: isUnread ? '1px solid #e2e8f0' : '1px solid transparent',
          transition: 'all 0.18s ease',
          display: 'flex',
          gap: '13px',
          alignItems: 'flex-start',
        }}
      >
        {/* Avatar Circular con Icono FontAwesome */}
        <div 
          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ 
            width: '40px', 
            height: '40px', 
            backgroundColor: visuals.bgColor, 
            color: visuals.color,
            fontSize: '15px',
            marginTop: '2px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <i className={visuals.icon}></i>
        </div>

        {/* Contenido de la Notificación */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="d-flex justify-content-between align-items-baseline gap-2 mb-1">
            <span 
              className="text-truncate" 
              style={{ 
                fontSize: '13.5px', 
                fontWeight: isUnread ? 700 : 600,
                color: '#1e293b',
                lineHeight: 1.3
              }}
              title={cleanedTitle}
            >
              {cleanedTitle}
            </span>
            <span className="text-muted flex-shrink-0" style={{ fontSize: '11px', fontWeight: 400 }}>
              {timeAgo}
            </span>
          </div>

          {cruceNombre && (
            <div className="text-truncate mb-2" style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.3 }} title={cruceNombre}>
              <i className="fa-solid fa-location-dot text-danger me-1"></i>
              <span>{cruceNombre}</span>
            </div>
          )}

          {/* Botones de acción y eliminación */}
          <div className="d-flex align-items-center justify-content-between mt-1">
            {ticketId ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTicketClick(ticketId);
                }}
                className="btn btn-sm"
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 10px',
                  borderRadius: '20px',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '10px' }}></i>
                Ver Ticket #{ticketId}
              </button>
            ) : <span />}

            <button
              onClick={(e) => handleDelete(e, notification.id)}
              className="btn btn-sm btn-link p-0 text-muted btn-delete-notif"
              title="Eliminar notificación"
              style={{ width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <i className="fa-solid fa-xmark" style={{ fontSize: '12px' }}></i>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Botón de la Campana */}
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown && typeof refresh === 'function') {
            refresh();
          }
        }}
        className="btn btn-light position-relative d-flex align-items-center justify-content-center"
        style={{
          width: '38px',
          height: '38px',
          padding: 0,
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          backgroundColor: showDropdown ? '#f1f5f9' : (safeCriticalAlerts.length > 0 ? '#fff8f8' : '#ffffff'),
          color: safeCriticalAlerts.length > 0 ? '#dc2626' : '#475569',
          transition: 'all 0.2s ease',
        }}
        title={
          isConnected 
            ? (safeCriticalAlerts.length > 0 ? `${safeCriticalAlerts.length} alertas críticas activas` : 'Notificaciones') 
            : 'Notificaciones (desconectado)'
        }
      >
        <i className="fa-solid fa-bell" style={{ fontSize: '16px' }}></i>
        
        {/* Indicador de estado de conexión */}
        {!isConnected && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '7px',
              height: '7px',
              backgroundColor: '#f59e0b',
              borderRadius: '50%',
              border: '1.5px solid white',
            }}
            title="Reconectando con el servidor..."
          />
        )}

        {/* Badge de contador */}
        {totalBadgeCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
            style={{
              backgroundColor: safeCriticalAlerts.length > 0 ? '#dc2626' : 'var(--primary, #1d546d)',
              color: '#ffffff',
              fontSize: '10px',
              padding: '3px 6px',
              fontWeight: '600',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            }}
          >
            {totalBadgeCount > 99 ? '99+' : totalBadgeCount}
          </span>
        )}
      </button>

      {/* Dropdown de Notificaciones */}
      {showDropdown && (
        <>
          {/* Backdrop invisible para cerrar al hacer clic afuera */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1055,
            }}
            onClick={() => setShowDropdown(false)}
          />

          <div
            className="card shadow-lg"
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              width: '400px',
              maxWidth: 'calc(100vw - 20px)',
              maxHeight: '600px',
              zIndex: 1060,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              overflow: 'hidden',
              boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.2), 0 8px 16px -4px rgba(15, 23, 42, 0.08)',
              animation: 'dropdownFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* 1. Header del Dropdown (Espacioso y con tipografía moderna) */}
            <div 
              className="d-flex justify-content-between align-items-center"
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f1f5f9',
                backgroundColor: '#ffffff'
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <h6 className="mb-0 fw-bold" style={{ fontSize: '16px', color: '#0f172a' }}>
                  Notificaciones
                </h6>
                {unreadCount > 0 && (
                  <span 
                    className="badge rounded-pill"
                    style={{ 
                      backgroundColor: '#eff6ff', 
                      color: 'var(--primary, #1d546d)', 
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '4px 8px'
                    }}
                  >
                    {unreadCount} nuevas
                  </span>
                )}
              </div>

              <div className="d-flex align-items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="btn btn-sm btn-link p-0 text-decoration-none"
                    style={{ 
                      fontSize: '12.5px', 
                      color: 'var(--primary, #1d546d)', 
                      fontWeight: '600' 
                    }}
                  >
                    Marcar leídas
                  </button>
                )}
                <button
                  onClick={handleRefresh}
                  className="btn btn-sm btn-light border-0 p-1 text-muted"
                  title="Actualizar notificaciones"
                  style={{ width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <i className={`fa-solid fa-arrows-rotate ${isRefreshing ? 'fa-spin' : ''}`} style={{ fontSize: '12px' }}></i>
                </button>
              </div>
            </div>

            {/* 2. Lista de Notificaciones con Márgenes y Scroll Suave */}
            <div 
              style={{ 
                overflowY: 'auto', 
                overflowX: 'hidden', 
                maxHeight: '460px', 
                backgroundColor: '#ffffff',
                padding: '8px 0',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {/* SECCIÓN A: ALERTAS CRÍTICAS */}
              {safeCriticalAlerts.length > 0 && (
                <div style={{ width: '100%', overflowX: 'hidden', marginBottom: '8px' }}>
                  <div 
                    style={{ 
                      padding: '8px 20px 4px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center' 
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.8px', color: '#dc2626' }}>
                      <i className="fa-solid fa-triangle-exclamation me-1.5"></i>
                      ALERTAS CRÍTICAS ACTIVAS
                    </span>
                    <span 
                      className="badge rounded-pill"
                      style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '10px', padding: '3px 8px', fontWeight: '700' }}
                    >
                      {safeCriticalAlerts.length}
                    </span>
                  </div>

                  {safeCriticalAlerts.map((alert, index) => {
                    if (!alert) return null;
                    const ticketId = alert.data?.ticketId || alert.ticketId || alert.id;
                    const rawTipo = alert.data?.incidenciaTipo || alert.title || 'Incidencia Crítica';
                    const tipoIncidencia = cleanText(rawTipo);
                    const rawCruce = alert.data?.cruceNombre || alert.message || `Cruce #${alert.data?.cruceId || 'N/A'}`;
                    const cruceNombre = cleanText(rawCruce);
                    const timeAgo = safeFormatTime(alert.createdAt);

                    return (
                      <div
                        key={`crit-${ticketId}-${index}`}
                        onClick={() => handleTicketClick(ticketId)}
                        className="notification-item-card"
                        style={{
                          cursor: 'pointer',
                          padding: '12px 16px',
                          margin: '4px 12px 6px',
                          borderRadius: '10px',
                          backgroundColor: '#fffcfc',
                          border: '1px solid #fee2e2',
                          transition: 'all 0.18s ease',
                          display: 'flex',
                          gap: '13px',
                          alignItems: 'flex-start',
                        }}
                      >
                        {/* Icono circular */}
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            backgroundColor: '#fee2e2', 
                            color: '#dc2626',
                            fontSize: '16px',
                            marginTop: '2px',
                            boxShadow: '0 1px 2px rgba(220, 38, 38, 0.15)'
                          }}
                        >
                          <i className="fa-solid fa-triangle-exclamation"></i>
                        </div>

                        {/* Contenido */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="d-flex justify-content-between align-items-baseline gap-2 mb-1">
                            <span 
                              className="text-truncate" 
                              style={{ fontSize: '13.5px', fontWeight: 700, color: '#991b1b', lineHeight: 1.3 }} 
                              title={tipoIncidencia}
                            >
                              {tipoIncidencia}
                            </span>
                            <span className="text-muted flex-shrink-0" style={{ fontSize: '11px', fontWeight: 400 }}>
                              {timeAgo}
                            </span>
                          </div>

                          <div className="text-truncate mb-2" style={{ fontSize: '12px', color: '#475569', lineHeight: 1.3 }} title={cruceNombre}>
                            <i className="fa-solid fa-location-dot text-danger me-1"></i>
                            <span className="fw-medium text-dark">{cruceNombre}</span>
                          </div>

                          {/* Botón de acción */}
                          <div className="mt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTicketClick(ticketId);
                              }}
                              className="btn btn-sm"
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 10px',
                                borderRadius: '20px',
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                border: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '10px' }}></i>
                              Ver Ticket #{ticketId}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SECCIÓN B: NOTIFICACIONES AGRUPADAS POR FECHA */}
              {/* GRUPO HOY */}
              {groupedNotifications.today.length > 0 && (
                <div style={{ width: '100%', overflowX: 'hidden', marginBottom: '8px' }}>
                  <div 
                    style={{ 
                      padding: '10px 20px 4px', 
                      fontSize: '11px', 
                      fontWeight: '700', 
                      letterSpacing: '0.8px', 
                      color: '#64748b'
                    }}
                  >
                    HOY
                  </div>
                  {groupedNotifications.today.map(n => renderNotificationItem(n))}
                </div>
              )}

              {/* GRUPO AYER */}
              {groupedNotifications.yesterday.length > 0 && (
                <div style={{ width: '100%', overflowX: 'hidden', marginBottom: '8px' }}>
                  <div 
                    style={{ 
                      padding: '10px 20px 4px', 
                      fontSize: '11px', 
                      fontWeight: '700', 
                      letterSpacing: '0.8px', 
                      color: '#64748b'
                    }}
                  >
                    AYER
                  </div>
                  {groupedNotifications.yesterday.map(n => renderNotificationItem(n))}
                </div>
              )}

              {/* GRUPO ANTERIORES */}
              {groupedNotifications.older.length > 0 && (
                <div style={{ width: '100%', overflowX: 'hidden', marginBottom: '8px' }}>
                  <div 
                    style={{ 
                      padding: '10px 20px 4px', 
                      fontSize: '11px', 
                      fontWeight: '700', 
                      letterSpacing: '0.8px', 
                      color: '#64748b'
                    }}
                  >
                    ANTERIORES
                  </div>
                  {groupedNotifications.older.map(n => renderNotificationItem(n))}
                </div>
              )}

              {/* ESTADO VACÍO */}
              {totalItemsCount === 0 && (
                <div className="text-center py-5 px-3">
                  <div 
                    className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: '52px', height: '52px', backgroundColor: '#f1f5f9', color: '#94a3b8' }}
                  >
                    <i className="fa-solid fa-bell-slash" style={{ fontSize: '22px' }}></i>
                  </div>
                  <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '14px' }}>
                    No hay notificaciones
                  </h6>
                  <p className="text-muted mb-0" style={{ fontSize: '12px' }}>
                    No tienes alertas ni notificaciones pendientes.
                  </p>
                </div>
              )}
            </div>

            {/* 3. Footer del Dropdown */}
            <div 
              className="d-flex justify-content-between align-items-center"
              style={{
                padding: '14px 20px',
                borderTop: '1px solid #f1f5f9',
                backgroundColor: '#ffffff'
              }}
            >
              {safeNotifications.length > 0 ? (
                <button
                  onClick={handleClearAll}
                  className="btn btn-sm btn-link p-0 text-decoration-none text-danger fw-semibold"
                  style={{ fontSize: '12px' }}
                >
                  <i className="fa-solid fa-trash-can me-1.5"></i>
                  Limpiar notificaciones
                </button>
              ) : (
                <span className="small text-muted d-flex align-items-center gap-1.5" style={{ fontSize: '11.5px' }}>
                  <i className={`fa-solid fa-circle ${isConnected ? 'text-success' : 'text-warning'}`} style={{ fontSize: '8px' }}></i>
                  {isConnected ? 'En tiempo real' : 'Desconectado'}
                </span>
              )}

              <button
                onClick={() => {
                  navigate('/incidents');
                  setShowDropdown(false);
                }}
                className="btn btn-sm btn-link p-0 text-decoration-none fw-semibold"
                style={{ fontSize: '12px', color: 'var(--primary, #1d546d)' }}
              >
                Ver Incidencias <i className="fa-solid fa-chevron-right ms-1 small"></i>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Estilos adicionales */}
      <style>{`
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .notification-item-card:hover {
          background-color: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
        }
        .notification-item-card .btn-delete-notif {
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .notification-item-card:hover .btn-delete-notif {
          opacity: 0.7;
        }
        .notification-item-card .btn-delete-notif:hover {
          opacity: 1;
          color: #dc2626 !important;
        }
      `}</style>
    </div>
  );
}
