import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Asegurar compatibilidad de plugins legacy de Leaflet en Vite/ESM
if (typeof window !== 'undefined') {
  (window as any).L = L;
}
import 'leaflet.heat';

interface HeatmapLayerProps {
  points: Array<[number, number, number]>; // [lat, lng, intensity]
  options?: {
    radius?: number;
    blur?: number;
    maxZoom?: number;
    max?: number;
    minOpacity?: number;
    gradient?: { [key: number]: string };
  };
}

export function HeatmapLayer({ points, options }: HeatmapLayerProps) {
  const map = useMap();
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    // Remover capa previa si existe
    if (layerRef.current) {
      try {
        map.removeLayer(layerRef.current);
      } catch {
        // Ignorar si ya fue removido del DOM
      }
      layerRef.current = null;
    }

    if (!points || points.length === 0) return;

    const defaultOptions = {
      radius: 22,
      blur: 16,
      maxZoom: 16,
      max: 1.0,
      minOpacity: 0.25,
      gradient: {
        0.2: '#3b82f6', // azul suave
        0.4: '#06b6d4', // cian / turquesa
        0.6: '#10b981', // verde esmeralda
        0.8: '#f59e0b', // ámbar / naranja
        1.0: '#ef4444', // rojo suave
      },
      ...options,
    };

    try {
      const heatFn = (L as any).heatLayer || (window as any).L?.heatLayer;
      if (typeof heatFn === 'function') {
        const heatLayer = heatFn(points, defaultOptions).addTo(map);
        layerRef.current = heatLayer;
      } else {
        console.warn('Leaflet heatLayer no se encuentra disponible');
      }
    } catch (err) {
      console.error('Error al inicializar capa de calor:', err);
    }

    return () => {
      if (layerRef.current && map) {
        try {
          map.removeLayer(layerRef.current);
        } catch {
          // Ignorar
        }
        layerRef.current = null;
      }
    };
  }, [map, points, JSON.stringify(options || {})]);

  return null;
}
