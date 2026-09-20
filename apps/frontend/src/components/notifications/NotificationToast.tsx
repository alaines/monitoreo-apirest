import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationsStore } from '../../stores/notificationsStore';

// Eliminar cualquier emoji que venga en títulos o mensajes
function cleanText(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
    .trim();
}

export function NotificationToast() {
  const navigate = useNavigate();
  const { activeToast, hideToast } = useNotificationsStore();

  useEffect(() => {
    if (activeToast) {
      // Auto-hide después de 8 segundos
      const timer = setTimeout(() => {
        hideToast();
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [activeToast, hideToast]);

  if (!activeToast) return null;

  const handleClick = () => {
    const ticketId = activeToast.data?.ticketId || (activeToast as any).ticketId;
    if (ticketId) {
      navigate(`/incidents/${ticketId}`);
    } else if (activeToast.link) {
      navigate(activeToast.link);
    }
    hideToast();
  };

  const getNotificationConfig = (type: string, title?: string) => {
    const t = ((type || '') + ' ' + (title || '')).toUpperCase();
    if (t.includes('CRITIC') || t.includes('ALERTA') || t.includes('EMERGENCY') || t.includes('APAGAD')) {
      return { 
        color: '#dc2626', 
        bgColor: '#fee2e2', 
        icon: 'fa-solid fa-triangle-exclamation' 
      };
    }
    if (t.includes('SEMAFORO') || t.includes('CRUCE') || t.includes('INTERMITENTE')) {
      return { 
        color: '#dc2626', 
        bgColor: '#fee2e2', 
        icon: 'fa-solid fa-traffic-light' 
      };
    }
    if (t.includes('NUEVA') || t.includes('NEW') || t.includes('CREAT')) {
      return { 
        color: '#d97706', 
        bgColor: '#fef3c7', 
        icon: 'fa-solid fa-bolt' 
      };
    }
    if (t.includes('ACTUALIZADA') || t.includes('UPDATE') || t.includes('CAMBIO')) {
      return { 
        color: '#0284c7', 
        bgColor: '#e0f2fe', 
        icon: 'fa-solid fa-arrows-rotate' 
      };
    }
    if (t.includes('CERRADA') || t.includes('RESOLVED') || t.includes('EXITO')) {
      return { 
        color: '#16a34a', 
        bgColor: '#dcfce7', 
        icon: 'fa-solid fa-circle-check' 
      };
    }
    if (t.includes('ASIGNADA') || t.includes('ASSIGN') || t.includes('USER')) {
      return { 
        color: '#7c3aed', 
        bgColor: '#f3e8ff', 
        icon: 'fa-solid fa-user-check' 
      };
    }
    return { 
      color: 'var(--primary, #1d546d)', 
      bgColor: '#f1f5f9', 
      icon: 'fa-solid fa-bell' 
    };
  };

  const cleanToastTitle = cleanText(activeToast.title) || 'Notificación del Sistema';
  const cleanToastMessage = cleanText(activeToast.message);
  const config = getNotificationConfig(activeToast.type, cleanToastTitle);
  const ticketId = activeToast.data?.ticketId || (activeToast as any).ticketId;

  return (
    <div
      onClick={handleClick}
      className="card"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '390px',
        maxWidth: '92vw',
        zIndex: 9999,
        cursor: 'pointer',
        animation: 'slideInRight 0.3s ease-out',
        border: '1px solid var(--gray-300)',
        borderRadius: 'var(--border-radius-lg, 8px)',
        backgroundColor: 'var(--white)',
        boxShadow: '0 8px 24px rgba(6, 30, 41, 0.18)',
        overflow: 'hidden',
      }}
    >
      <div
        className="card-body p-0"
        style={{
          display: 'flex',
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            width: '5px',
            backgroundColor: config.color,
            flexShrink: 0,
          }}
        />
        
        <div style={{ flex: 1, padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: config.bgColor,
              color: config.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '16px',
            }}
          >
            <i className={config.icon}></i>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="d-flex justify-content-between align-items-start mb-1">
              <span 
                style={{ 
                  fontSize: '13px', 
                  fontWeight: '700', 
                  color: 'var(--primary-darkest)',
                  lineHeight: '1.2',
                }}
              >
                {cleanToastTitle}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  hideToast();
                }}
                className="btn btn-sm btn-link p-0 ms-2"
                style={{ fontSize: '13px', color: 'var(--gray-500)', lineHeight: 1 }}
                title="Cerrar"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {cleanToastMessage && (
              <p 
                className="mb-2" 
                style={{ 
                  fontSize: '12px', 
                  color: 'var(--gray-600)', 
                  lineHeight: '1.35',
                  margin: 0,
                }}
              >
                {cleanToastMessage}
              </p>
            )}

            {ticketId && (
              <div className="mt-2 pt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/incidents/${ticketId}`);
                    hideToast();
                  }}
                  className="btn btn-sm btn-primary py-0 px-2"
                  style={{ fontSize: '11px', borderRadius: '4px' }}
                >
                  <i className="fa-solid fa-arrow-up-right-from-square me-1"></i>
                  Ver Ticket #{ticketId}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div
        style={{
          height: '3px',
          backgroundColor: 'var(--gray-200)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            backgroundColor: config.color,
            animation: 'shrinkToast 8s linear',
          }}
        />
      </div>

      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(110%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes shrinkToast {
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
