import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { incidentsService, Incident } from '../../services/incidents.service';

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const estadoColors: Record<number, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  1: 'warning',  // Pendiente
  2: 'primary',  // En proceso
  3: 'success',  // Completado
  4: 'error',    // Cancelado
};

const estadoLabels: Record<number, string> = {
  1: 'Pendiente',
  2: 'En Proceso',
  3: 'Completado',
  4: 'Cancelado',
};

interface IncidentDetailProps {
  incidentId: number;
  onClose: () => void;
  onEdit?: (id: number) => void;
}

export function IncidentDetail({ incidentId, onClose, onEdit }: IncidentDetailProps) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncident(incidentId);
  }, [incidentId]);

  const loadIncident = async (incidentId: number) => {
    try {
      const data = await incidentsService.getIncident(incidentId);
      setIncident(data);
    } catch (error) {
      console.error('Error loading incident:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener coordenadas del cruce o del ticket
  const getCoordinates = () => {
    if (incident?.cruce?.latitud && incident?.cruce?.longitud) {
      return {
        latitude: incident.cruce.latitud,
        longitude: incident.cruce.longitud,
        source: 'cruce'
      };
    }
    if (incident?.latitude && incident?.longitude) {
      return {
        latitude: incident.latitude,
        longitude: incident.longitude,
        source: 'ticket'
      };
    }
    return null;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!incident) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Incidencia no encontrada
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pt: 2 }}>
      <Grid container spacing={3}>
        {/* Columna izquierda - Información */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información General
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Número de Ticket
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                    {incident.id}
                  </Typography>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tipo de Incidencia
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                    {incident.incidencia?.tipo || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Estado
                  </Typography>
                  <Chip
                    label={estadoLabels[incident.estadoId] || 'Desconocido'}
                    color={estadoColors[incident.estadoId] || 'default'}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Registrado por
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                    {incident.usuarioRegistra || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha de creación
                  </Typography>
                  <Typography variant="body1">
                    {new Date(incident.createdAt).toLocaleString('es-PE')}
                  </Typography>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Intersección/Cruce
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                    {incident.cruce?.nombre || incident.cruce?.codigo || 'Sin especificar'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Última Actualización
                  </Typography>
                  <Typography variant="body1">
                    {new Date(incident.updatedAt).toLocaleString('es-PE')}
                  </Typography>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Reportador
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                    {incident.reportador?.nombres && incident.reportador?.apellidos
                      ? `${incident.reportador.nombres} ${incident.reportador.apellidos}`
                      : 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Nombre
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                    {incident.reportadorNombres || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Dato de Contacto
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                    {incident.reportadorDatoContacto || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Equipo Asignado
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                    {incident.equipo?.nombre || 'Sin asignar'}
                  </Typography>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Detalle de Incidencia
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {incident.descripcion || 'Sin descripción'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Columna derecha - Mapa */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ position: { lg: 'sticky' }, top: 80, height: 'fit-content' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ubicación
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {(() => {
                const coords = getCoordinates();
                return coords ? (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Coordenadas {coords.source === 'cruce' ? '(del Cruce)' : '(del Ticket)'}
                      </Typography>
                      <Typography variant="body2">
                        Latitud: {coords.latitude.toFixed(6)}
                      </Typography>
                      <Typography variant="body2">
                        Longitud: {coords.longitude.toFixed(6)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ height: 600, borderRadius: 1, overflow: 'hidden' }}>
                      <MapContainer
                        center={[coords.latitude, coords.longitude]}
                        zoom={16}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <Marker position={[coords.latitude, coords.longitude]}>
                          <Popup>
                            <strong>{incident.cruce?.nombre || 'Incidencia'}</strong>
                            <br />
                            {incident.incidencia?.tipo}
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </Box>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Sin coordenadas registradas
                  </Typography>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
