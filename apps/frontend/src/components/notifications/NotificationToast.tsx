import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationsStore } from '../../stores/notificationsStore';

export function NotificationToast() {
  const navigate = useNavigate();
  const { activeToast, hideToast } = useNotificationsStore();

  useEffect(() => {
    if (activeToast) {
      // Auto-hide después de 10 segundos
      const timer = setTimeout(() => {
        hideToast();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [activeToast, hideToast]);

  if (!activeToast) return null;

  const handleClick = () => {
    if (activeToast.link) {
      navigate(activeToast.link);
    }
    hideToast();
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'new_incident':
        return {
          backgroundColor: '#dc3545',
          icon: 'fa-exclamation-circle',
        };
      case 'incident_updated':
        return {
          backgroundColor: '#ffc107',
          icon: 'fa-edit',
        };
      case 'incident_resolved':
        return {
          backgroundColor: '#28a745',
          icon: 'fa-check-circle',
        };
      case 'new_comment':
        return {
          backgroundColor: '#17a2b8',
          icon: 'fa-comment',
        };
      default:
        return {
          backgroundColor: '#6c757d',
          icon: 'fa-bell',
        };
    }
  };

  const style = getNotificationStyle(activeToast.type);

  return (
    <div
      onClick={handleClick}
      className="card shadow-lg"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '400px',
        zIndex: 9999,
        cursor: activeToast.link ? 'pointer' : 'default',
        animation: 'slideInRight 0.3s ease-out',
        border: 'none',
      }}
    >
      <div
        className="card-body p-0"
        style={{
          display: 'flex',
          alignItems: 'stretch',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '6px',
            backgroundColor: style.backgroundColor,
            flexShrink: 0,
          }}
        />
        
        <div style={{ flex: 1, padding: '16px', display: 'flex', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: style.backgroundColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0,
            }}
          >
            <i className={`fas ${style.icon} fa-lg`}></i>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="d-flex justify-content-between align-items-start mb-1">
              <h6 className="mb-0 fw-bold" style={{ fontSize: '14px' }}>
                {activeToast.title}
              </h6>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  hideToast();
                }}
                className="btn btn-sm btn-link text-muted p-0 ms-2"
                style={{ fontSize: '16px', lineHeight: 1 }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <p className="mb-2 text-muted" style={{ fontSize: '13px', lineHeight: '1.4' }}>
              {activeToast.message}
            </p>
            {activeToast.data?.ticketId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/incidents/${activeToast.data.ticketId}`);
                  hideToast();
                }}
                className="btn btn-sm btn-primary"
                style={{ fontSize: '12px', padding: '4px 12px' }}
              >
                <i className="fas fa-eye me-1"></i>
                Ver Incidencia
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div
        style={{
          height: '3px',
          backgroundColor: '#e9ecef',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            backgroundColor: style.backgroundColor,
            animation: 'shrink 10s linear',
          }}
        />
      </div>

      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes shrink {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}
      </style>
    </div>
  );
}
