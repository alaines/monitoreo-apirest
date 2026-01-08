import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { Notification } from '../../services/notifications.service';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const displayNotifications = showAll ? notifications : notifications.slice(0, 5);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.readAt) {
      await markAsRead(notification.id);
    }
    
    // Si tiene ticketId en data, navegar al detalle
    if (notification.data?.ticketId) {
      navigate(`/incidents/${notification.data.ticketId}`);
      setShowDropdown(false);
    } else if (notification.link) {
      navigate(notification.link);
      setShowDropdown(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_incident':
        return 'fa-exclamation-circle';
      case 'incident_updated':
        return 'fa-edit';
      case 'incident_resolved':
        return 'fa-check-circle';
      case 'new_comment':
        return 'fa-comment';
      default:
        return 'fa-bell';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_incident':
        return '#dc3545';
      case 'incident_updated':
        return '#ffc107';
      case 'incident_resolved':
        return '#28a745';
      case 'new_comment':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="btn btn-light position-relative"
        style={{
          fontSize: '20px',
          padding: '8px 12px',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
        }}
        title={isConnected ? 'Notificaciones (conectado)' : 'Notificaciones (desconectado)'}
      >
        <i className="fas fa-bell"></i>
        {!isConnected && (
          <span
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              backgroundColor: '#ffc107',
              borderRadius: '50%',
              border: '2px solid white',
            }}
          />
        )}
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '10px', padding: '3px 6px' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
            }}
            onClick={() => setShowDropdown(false)}
          />
          <div
            className="card shadow-lg"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '400px',
              maxHeight: '600px',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold">
                <i className="fas fa-bell me-2"></i>
                Notificaciones
              </h6>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="btn btn-sm btn-link text-decoration-none"
                  style={{ fontSize: '12px' }}
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div style={{ overflowY: 'auto', maxHeight: '500px' }}>
              {displayNotifications.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="fas fa-bell-slash fa-3x mb-3 opacity-25"></i>
                  <p className="mb-0">No hay notificaciones</p>
                </div>
              ) : (
                displayNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="border-bottom"
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      backgroundColor: notification.readAt ? 'white' : '#f8f9fa',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e9ecef';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = notification.readAt ? 'white' : '#f8f9fa';
                    }}
                  >
                    <div className="d-flex gap-3">
                      <div style={{ flexShrink: 0 }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: getNotificationColor(notification.type),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}
                        >
                          <i className={`fas ${getNotificationIcon(notification.type)}`}></i>
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="d-flex justify-content-between align-items-start">
                          <h6
                            className="mb-1"
                            style={{
                              fontSize: '14px',
                              fontWeight: notification.readAt ? 'normal' : 'bold',
                            }}
                          >
                            {notification.title}
                          </h6>
                          <button
                            onClick={(e) => handleDelete(e, notification.id)}
                            className="btn btn-sm btn-link text-muted p-0"
                            style={{ fontSize: '12px', marginLeft: '8px' }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                        <p
                          className="mb-1 text-muted"
                          style={{
                            fontSize: '13px',
                            lineHeight: '1.4',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {notification.message}
                        </p>
                        <small className="text-muted" style={{ fontSize: '11px' }}>
                          <i className="fas fa-clock me-1"></i>
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </small>
                        {notification.data?.ticketId && (
                          <div className="mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/incidents/${notification.data.ticketId}`);
                                setShowDropdown(false);
                              }}
                              className="btn btn-sm btn-outline-primary"
                              style={{ fontSize: '11px', padding: '2px 8px' }}
                            >
                              <i className="fas fa-eye me-1"></i>
                              Ver Seguimiento
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 5 && (
              <div className="card-footer bg-white border-top text-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="btn btn-sm btn-link text-decoration-none"
                >
                  {showAll ? 'Ver menos' : `Ver todas (${notifications.length})`}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
