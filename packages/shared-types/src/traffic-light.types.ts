export interface Intersection {
  id: number;
  ubigeoId: string;
  tipoGestion: number;
  administradorId?: number;
  proyectoId: number;
  via1: number;
  via2: number;
  tipoComunicacion?: number;
  estado?: boolean;
  tipoCruce?: number;
  tipoEstructura?: number;
  nombre?: string;
  latitud?: number;
  longitud?: number;
  codigo?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TrafficLight {
  id: number;
  cruceId: number;
  tipo?: string;
  estado?: boolean;
}

export interface MapMarker {
  id: number;
  lat: number;
  lng: number;
  tipo: 'intersection' | 'incident';
  titulo: string;
  descripcion?: string;
  icono?: string;
  color?: string;
}
