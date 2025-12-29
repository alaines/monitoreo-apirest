import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  Alert,
  MenuItem,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  incidentsService,
  CreateIncidentDto,
  UpdateIncidentDto,
  IncidenciaCatalog,
  PrioridadCatalog,
  EstadoCatalog,
} from '../../services/incidents.service';

// Fix Leaflet icon issue
try {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  // @ts-ignore
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
} catch (e) {
  // Ignore error
}

interface LocationMarkerProps {
  position: [number, number] | null;
  setPosition: (position: [number, number]) => void;
}

function LocationMarker({ position, setPosition }: LocationMarkerProps) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

interface IncidentFormProps {
  incidentId: number | null;
  onClose: () => void;
  onSave: () => void;
}

export function IncidentForm({ incidentId, onClose, onSave }: IncidentFormProps) {
  const isEditing = Boolean(incidentId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [incidencias, setIncidencias] = useState<IncidenciaCatalog[]>([]);
  const [prioridades, setPrioridades] = useState<PrioridadCatalog[]>([]);
  const [estados, setEstados] = useState<EstadoCatalog[]>([]);
  const [formData, setFormData] = useState({
    incidenciaId: '',
    prioridadId: '',
    cruceId: '',
    equipoId: '',
    estadoId: '',
    descripcion: '',
    reportadorNombres: '',
    reportadorDatoContacto: '',
  });

  useEffect(() => {
    loadCatalogs();
    if (isEditing && incidentId) {
      loadIncident(incidentId);
    }
  }, [incidentId, isEditing]);

  const loadCatalogs = async () => {
    try {
      const [incidenciasData, prioridadesData, estadosData] = await Promise.all([
        incidentsService.getIncidenciasCatalog(),
        incidentsService.getPrioridadesCatalog(),
        incidentsService.getEstadosCatalog(),
      ]);
      setIncidencias(incidenciasData);
      setPrioridades(prioridadesData);
      setEstados(estadosData);
    } catch (error) {
      console.error('Error loading catalogs:', error);
    }
  };

  const loadIncident = async (incidentId: number) => {
    try {
      const incident = await incidentsService.getIncident(incidentId);
      setFormData({
        incidenciaId: incident.incidenciaId?.toString() || '',
        prioridadId: incident.prioridadId?.toString() || '',
        cruceId: incident.cruceId?.toString() || '',
        equipoId: incident.equipoId?.toString() || '',
        estadoId: incident.estadoId?.toString() || '',
        descripcion: incident.descripcion || '',
        reportadorNombres: incident.reportadorNombres || '',
        reportadorDatoContacto: incident.reportadorDatoContacto || '',
      });
      if (incident.latitude && incident.longitude) {
        setPosition([incident.latitude, incident.longitude]);
      }
    } catch (error) {
      console.error('Error loading incident:', error);
      setError('Error al cargar la incidencia');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!position) {
      setError('Por favor, seleccione una ubicación en el mapa');
      return;
    }

    if (!formData.incidenciaId) {
      setError('El tipo de incidencia es requerido');
      return;
    }

    setLoading(true);

    try {
      const data: CreateIncidentDto | UpdateIncidentDto = {
        incidenciaId: parseInt(formData.incidenciaId),
        prioridadId: formData.prioridadId ? parseInt(formData.prioridadId) : undefined,
        cruceId: formData.cruceId ? parseInt(formData.cruceId) : undefined,
        descripcion: formData.descripcion,
        reportadorNombres: formData.reportadorNombres,
        reportadorDatoContacto: formData.reportadorDatoContacto,
        latitude: position[0],
        longitude: position[1],
      };

      if (isEditing && incidentId) {
        await incidentsService.updateIncident(incidentId, {
          ...data,
          equipoId: formData.equipoId ? parseInt(formData.equipoId) : undefined,
          estadoId: formData.estadoId ? parseInt(formData.estadoId) : undefined,
        });
      } else {
        await incidentsService.createIncident(data as CreateIncidentDto);
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving incident:', error);
      setError(error.response?.data?.message || 'Error al guardar la incidencia');
    } finally {
      setLoading(false);
    }
  };

  // Lima, Peru coordinates as default
  const center: [number, number] = position || [-12.0464, -77.0428];

  return (
    <Box sx={{ pt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* @ts-ignore */}
        <Grid container spacing={3}>
          {/* @ts-ignore */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Información de la Incidencia
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Tipo de Incidencia *"
                      name="incidenciaId"
                      value={formData.incidenciaId}
                      onChange={handleChange}
                      required
                    >
                      {incidencias.map((inc) => (
                        <MenuItem key={inc.id} value={inc.id}>
                          {inc.tipo}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Prioridad"
                      name="prioridadId"
                      value={formData.prioridadId}
                      onChange={handleChange}
                    >
                      <MenuItem value="">Sin prioridad</MenuItem>
                      {prioridades.map((prio) => (
                        <MenuItem key={prio.id} value={prio.id}>
                          {prio.nombre}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Cruce ID"
                      name="cruceId"
                      type="number"
                      value={formData.cruceId}
                      onChange={handleChange}
                    />
                  </Grid>

                  {isEditing && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Equipo ID"
                          name="equipoId"
                          type="number"
                          value={formData.equipoId}
                          onChange={handleChange}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          select
                          label="Estado"
                          name="estadoId"
                          value={formData.estadoId}
                          onChange={handleChange}
                        >
                          <MenuItem value="">Sin cambio</MenuItem>
                          {estados.map((estado) => (
                            <MenuItem key={estado.id} value={estado.id}>
                              {estado.nombre}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Descripción"
                      name="descripcion"
                      multiline
                      rows={4}
                      value={formData.descripcion}
                      onChange={handleChange}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nombre del Reportador"
                      name="reportadorNombres"
                      value={formData.reportadorNombres}
                      onChange={handleChange}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Contacto del Reportador"
                      name="reportadorDatoContacto"
                      value={formData.reportadorDatoContacto}
                      onChange={handleChange}
                    />
                  </Grid>

                  {position && (
                    <Grid item xs={12}>
                      <Alert severity="info">
                        Coordenadas: {position[0].toFixed(6)}, {position[1].toFixed(6)}
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ubicación en el Mapa *
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Haga clic en el mapa para seleccionar la ubicación
                </Typography>

                <Box sx={{ height: 400, border: '1px solid #ddd', borderRadius: 1 }}>
                  {/* @ts-ignore */}
                  <MapContainer
                    center={center}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    {/* @ts-ignore */}
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker position={position} setPosition={setPosition} />
                  </MapContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}
