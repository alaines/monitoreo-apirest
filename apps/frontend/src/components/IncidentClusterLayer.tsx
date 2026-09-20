import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Incident } from '../services/incidents.service';

// Asegurar compatibilidad de plugins legacy de Leaflet en Vite/ESM
if (typeof window !== 'undefined') {
  (window as any).L = L;
}

interface IncidentClusterLayerProps {
  incidents: Incident[];
  onSelectIncident: (incidentId: number) => void;
}

// Función para determinar el nivel de criticidad de una incidencia
export function getIncidentSeverity(incident: Incident): 'critical' | 'medium' | 'low' {
  const prioridadId = incident.prioridadId ?? incident.incidencia?.prioridad?.id;
  const tipo = incident.incidencia?.tipo?.toLowerCase() || '';

  // Crítico: prioridad 1 (ALTA), semáforo/cruce apagado (id 66), o palabras clave de siniestro/apagado
  if (
    prioridadId === 1 ||
    incident.incidenciaId === 66 ||
    tipo.includes('apagado') ||
    tipo.includes('siniestro') ||
    tipo.includes('crítico') ||
    tipo.includes('critica')
  ) {
    return 'critical';
  }

  // Medio: prioridad 2 (MEDIA) o en proceso (estadoId === 2)
  if (prioridadId === 2 || incident.estadoId === 2) {
    return 'medium';
  }

  // Normal / Bajo: prioridad 3 (BAJA) u otros
  return 'low';
}

// Crear icono para marcador individual
function createIndividualMarkerIcon(severity: 'critical' | 'medium' | 'low') {
  let markerClass = 'marker-normal';
  let iconHtml = '<i class="fa-solid fa-traffic-light"></i>';

  if (severity === 'critical') {
    markerClass = 'marker-critical';
    iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';
  } else if (severity === 'medium') {
    markerClass = 'marker-medium';
    iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';
  }

  const size = 30;

  return L.divIcon({
    className: 'leaflet-custom-individual-marker',
    html: `
      <div class="individual-marker-bubble ${markerClass}">
        <div class="marker-center">
          ${iconHtml}
        </div>
      </div>
    `,
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
    popupAnchor: L.point(0, -size / 2),
  });
}

// Crear contenido del popup de Bootstrap 5
function createPopupContent(incident: Incident, onSelect: (id: number) => void): HTMLElement {
  const container = document.createElement('div');

  const severity = getIncidentSeverity(incident);
  const prioridadNombre =
    incident.incidencia?.prioridad?.nombre ||
    (severity === 'critical' ? 'ALTA' : severity === 'medium' ? 'MEDIA' : 'BAJA');
  const estadoNombre = incident.estado?.nombre || (incident.estadoId === 2 ? 'En Proceso' : incident.estadoId === 3 || incident.estadoId === 4 ? 'Resuelto' : 'Pendiente');

  let badgePrioridadClass = 'bg-primary text-white';
  if (severity === 'critical') {
    badgePrioridadClass = 'bg-danger text-white';
  } else if (severity === 'medium') {
    badgePrioridadClass = 'bg-warning text-dark';
  }

  let badgeEstadoClass = 'bg-light text-dark border';
  if (incident.estadoId === 1) {
    badgeEstadoClass = 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
  } else if (incident.estadoId === 2) {
    badgeEstadoClass = 'bg-info-subtle text-info-emphasis border border-info-subtle';
  } else if (incident.estadoId === 5) {
    badgeEstadoClass = 'bg-primary-subtle text-primary border border-primary-subtle';
  } else if (incident.estadoId === 3) {
    badgeEstadoClass = 'bg-secondary-subtle text-secondary border border-secondary-subtle';
  } else if (incident.estadoId === 4) {
    badgeEstadoClass = 'bg-success-subtle text-success-emphasis border border-success-subtle';
  }

  const cruceCodigo = incident.cruce?.codigo || '';
  const cruceNombre = incident.cruce?.nombre || `Intersección #${incident.cruceId || incident.id}`;
  const distrito = incident.cruce?.ubigeo?.distrito || '';
  const tipoIncidencia = incident.incidencia?.tipo || 'Incidencia Técnica';

  let tiempoTexto = 'Registrado recientemente';
  let diasSinAtencion = 0;
  if (incident.createdAt) {
    const createdTime = new Date(incident.createdAt).getTime();
    diasSinAtencion = Math.floor((Date.now() - createdTime) / (1000 * 60 * 60 * 24));
    if (diasSinAtencion <= 0) {
      tiempoTexto = 'Registrado hoy';
    } else {
      tiempoTexto = `${diasSinAtencion} día${diasSinAtencion > 1 ? 's' : ''} sin atención`;
    }
  }

  container.innerHTML = `
    <div class="card border-0" style="min-width: 270px; max-width: 320px; font-family: inherit;">
      <div class="card-header bg-white border-bottom py-2 px-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-1">
          <span class="badge ${badgePrioridadClass}" style="font-size: 10px;">${prioridadNombre}</span>
          <span class="badge ${badgeEstadoClass}" style="font-size: 10px;">${estadoNombre}</span>
        </div>
        <span class="text-muted fw-bold" style="font-size: 11px;">#${incident.id}</span>
      </div>
      <div class="card-body p-3">
        <div class="mb-2">
          <div class="fw-bold text-dark mb-1" style="font-size: 12.5px; line-height: 1.3;">
            ${cruceCodigo ? `<span class="badge bg-secondary-subtle text-secondary border me-1" style="font-size: 10.5px;">${cruceCodigo}</span>` : ''}
            ${cruceNombre}
          </div>
          ${distrito ? `<div class="text-muted" style="font-size: 11px;"><i class="fa-solid fa-location-dot text-danger me-1"></i>${distrito}</div>` : ''}
        </div>

        <div class="p-2 rounded bg-light border mb-2">
          <div class="text-muted" style="font-size: 10px; text-transform: uppercase; font-weight: 600;">Tipo de Incidencia:</div>
          <div class="fw-semibold text-dark" style="font-size: 11.5px;">${tipoIncidencia}</div>
        </div>

        <div class="mb-2 ${diasSinAtencion > 0 && severity === 'critical' ? 'text-danger fw-semibold' : 'text-muted'}" style="font-size: 11px;">
          <i class="fa-solid fa-clock me-1"></i>${tiempoTexto}
        </div>

        <button type="button" class="btn btn-primary btn-sm w-100 py-1 fw-semibold btn-action-incident" style="font-size: 11.5px;">
          <i class="fa-solid fa-arrow-up-right-from-square me-1"></i> Gestionar / Ver Incidencia
        </button>
      </div>
    </div>
  `;

  const btn = container.querySelector('.btn-action-incident');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      onSelect(incident.id);
    });
  }

  return container;
}

export function IncidentClusterLayer({ incidents, onSelectIncident }: IncidentClusterLayerProps) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    // Si ya existe un grupo de clusters previo, removerlo del mapa
    if (clusterGroupRef.current) {
      try {
        map.removeLayer(clusterGroupRef.current);
      } catch {
        // Ignorar
      }
      clusterGroupRef.current = null;
    }

    if (!incidents || incidents.length === 0) return;

    // Configurar MarkerClusterGroup con función de creación de iconos personalizada por jerarquía de severidad
    const clusterGroup = (L as any).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 55,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      animate: true,
      removeOutsideVisibleBounds: true,
      iconCreateFunction: (cluster: any) => {
        const markers = cluster.getAllChildMarkers() as Array<L.Marker & { incidentData?: Incident }>;
        const count = cluster.getChildCount();

        let hasCritical = false;
        let hasMedium = false;

        for (const marker of markers) {
          if (marker.incidentData) {
            const severity = getIncidentSeverity(marker.incidentData);
            if (severity === 'critical') {
              hasCritical = true;
              break; // Crítico tiene la máxima prioridad visual
            }
            if (severity === 'medium') {
              hasMedium = true;
            }
          }
        }

        let clusterClass = 'cluster-low';
        if (hasCritical) {
          clusterClass = 'cluster-critical';
        } else if (hasMedium) {
          clusterClass = 'cluster-medium';
        }

        // Ajustar el tamaño del círculo según la cantidad de elementos agrupados
        let size = 36;
        if (count >= 100) {
          size = 50;
        } else if (count >= 20) {
          size = 42;
        }

        return L.divIcon({
          html: `
            <div class="cluster-bubble ${clusterClass}">
              <div class="cluster-center">
                <span>${count}</span>
              </div>
            </div>
          `,
          className: 'leaflet-cluster-custom',
          iconSize: L.point(size, size),
          iconAnchor: L.point(size / 2, size / 2),
        });
      },
    });

    // Agregar cada marcador individual al grupo
    const markersToAdd: L.Marker[] = [];

    incidents.forEach((incident) => {
      const lat = Number(incident.latitude);
      const lng = Number(incident.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const severity = getIncidentSeverity(incident);
      const icon = createIndividualMarkerIcon(severity);

      const marker = L.marker([lat, lng], { icon }) as L.Marker & { incidentData?: Incident };
      marker.incidentData = incident;

      const popupContent = createPopupContent(incident, onSelectIncident);
      marker.bindPopup(popupContent, {
        maxWidth: 320,
        minWidth: 260,
        className: 'leaflet-bootstrap-popup',
      });

      markersToAdd.push(marker);
    });

    clusterGroup.addLayers(markersToAdd);
    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    return () => {
      if (clusterGroupRef.current && map) {
        try {
          map.removeLayer(clusterGroupRef.current);
        } catch {
          // Ignorar
        }
        clusterGroupRef.current = null;
      }
    };
  }, [map, incidents, onSelectIncident]);

  return null;
}
