import { useState, useEffect } from 'react';
import { incidentsService } from '../../services/incidents.service';

interface IncidentTrackingProps {
  incidentId: number;
}

interface TimelineEvent {
  id: number;
  timestamp: string;
  event: string;
  user: string;
  description?: string;
}

export function IncidentTracking({ incidentId }: IncidentTrackingProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [incidentId]);

  const loadEvents = async () => {
    try {
      // Por ahora, creamos eventos de ejemplo basados en la incidencia
      const incident = await incidentsService.getIncident(incidentId);
      
      const timelineEvents: TimelineEvent[] = [
        {
          id: 1,
          timestamp: incident.createdAt,
          event: 'Incidencia Creada',
          user: incident.usuarioRegistra || 'Sistema',
          description: `Incidencia tipo "${incident.incidencia?.tipo}" registrada`
        }
      ];

      if (incident.equipoId) {
        timelineEvents.push({
          id: 2,
          timestamp: incident.updatedAt,
          event: 'Equipo Asignado',
          user: 'Sistema',
          description: `Asignado a equipo: ${incident.equipo?.nombre}`
        });
      }

      if (incident.estadoId !== 1) {
        timelineEvents.push({
          id: 3,
          timestamp: incident.updatedAt,
          event: 'Cambio de Estado',
          user: 'Sistema',
          description: `Estado actualizado a: ${getEstadoLabel(incident.estadoId)}`
        });
      }

      setEvents(timelineEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoLabel = (estadoId: number): string => {
    const labels: Record<number, string> = {
      1: 'Pendiente',
      2: 'En Proceso',
      3: 'Completado',
      4: 'Cancelado'
    };
    return labels[estadoId] || 'Desconocido';
  };

  const getEventIcon = (eventName: string): string => {
    if (eventName.includes('Creada')) return 'fa-plus-circle';
    if (eventName.includes('Asignado')) return 'fa-users';
    if (eventName.includes('Estado')) return 'fa-sync';
    if (eventName.includes('Completado')) return 'fa-check-circle';
    return 'fa-circle';
  };

  const getEventColor = (eventName: string): string => {
    if (eventName.includes('Creada')) return 'primary';
    if (eventName.includes('Asignado')) return 'info';
    if (eventName.includes('Estado')) return 'warning';
    if (eventName.includes('Completado')) return 'success';
    return 'secondary';
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <h5 className="mb-4">
        <i className="fas fa-history me-2"></i>
        Seguimiento de Incidencia
      </h5>

      <div className="card">
        <div className="card-body">
          {events.length === 0 ? (
            <div className="alert alert-info">
              <i className="fas fa-info-circle me-2"></i>
              No hay eventos registrados para esta incidencia
            </div>
          ) : (
            <div className="timeline">
              {events.map((event, index) => (
                <div key={event.id} className="timeline-item mb-4">
                  <div className="d-flex">
                    <div className="flex-shrink-0 me-3">
                      <div 
                        className={`rounded-circle bg-${getEventColor(event.event)} text-white d-flex align-items-center justify-content-center`}
                        style={{ width: '40px', height: '40px' }}
                      >
                        <i className={`fas ${getEventIcon(event.event)}`}></i>
                      </div>
                      {index < events.length - 1 && (
                        <div 
                          className="bg-secondary mx-auto" 
                          style={{ width: '2px', height: '60px', marginTop: '8px' }}
                        ></div>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-0">{event.event}</h6>
                            <small className="text-muted">
                              {new Date(event.timestamp).toLocaleString('es-PE')}
                            </small>
                          </div>
                          <p className="text-muted small mb-1">
                            <i className="fas fa-user me-1"></i>
                            {event.user}
                          </p>
                          {event.description && (
                            <p className="mb-0 text-secondary">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
