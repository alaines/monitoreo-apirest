import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          padding: '24px'
        }}>
          <div style={{ 
            maxWidth: '520px', 
            width: '100%', 
            background: '#ffffff', 
            padding: '32px', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0', 
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '20px'
            }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            
            <h4 style={{ color: '#0f172a', fontWeight: 700, marginBottom: '10px' }}>
              Ha ocurrido un error inesperado
            </h4>
            
            <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '20px', lineHeight: 1.5 }}>
              {this.state.error?.message || 'Error durante la ejecución del sistema.'}
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => window.location.reload()} 
                className="btn btn-primary"
                style={{ 
                  backgroundColor: '#1d546d', 
                  borderColor: '#1d546d', 
                  fontWeight: 600, 
                  fontSize: '13px',
                  padding: '8px 18px',
                  borderRadius: '6px'
                }}
              >
                <i className="fa-solid fa-arrows-rotate me-2"></i>
                Recargar página
              </button>
              
              <button 
                onClick={() => {
                  window.location.href = '/login';
                }} 
                className="btn btn-outline-secondary"
                style={{ 
                  fontWeight: 600, 
                  fontSize: '13px',
                  padding: '8px 18px',
                  borderRadius: '6px'
                }}
              >
                <i className="fa-solid fa-arrow-right-to-bracket me-2"></i>
                Ir al Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
