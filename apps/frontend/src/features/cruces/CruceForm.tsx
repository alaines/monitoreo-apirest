import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import { customSelectStyles } from '../../styles/react-select-custom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { crucesService, Cruce } from '../../services/cruces.service';
import { tiposService, Tipo } from '../../services/tipos.service';
import { administradoresService, Administrador } from '../../services/administradores.service';
import { ubigeosService, Ubigeo } from '../../services/ubigeos.service';
import { ejesService, Eje } from '../../services/ejes.service';

// Fix para iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function DraggableMarker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  const markerRef = useRef<any>(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const pos = marker.getLatLng();
        setPosition([pos.lat, pos.lng]);
      }
    },
  };

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

function MapClickHandler({ setPosition }: { setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, map.getZoom() || 16);
    }
  }, [center[0], center[1], map]);
  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer().parentElement;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    resizeObserver.observe(container);

    const timers = [50, 150, 300, 500].map(delay =>
      setTimeout(() => {
        map.invalidateSize();
      }, delay)
    );

    return () => {
      resizeObserver.disconnect();
      timers.forEach(t => clearTimeout(t));
    };
  }, [map]);
  return null;
}

export function CruceForm({ cruceId, onClose, onSave }: { cruceId?: number | null, onClose?: () => void, onSave?: () => void }) {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const id = cruceId ?? (paramId ? parseInt(paramId) : undefined);
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [administradores, setAdministradores] = useState<Administrador[]>([]);
  const [ubigeos, setUbigeos] = useState<Ubigeo[]>([]);
  const [ejes, setEjes] = useState<Eje[]>([]);
  const [distritoSearch, setDistritoSearch] = useState('');
  const [showDistritoDropdown, setShowDistritoDropdown] = useState(false);
  const [hasOriginalCoords, setHasOriginalCoords] = useState(true);
  const distritoRef = useRef<HTMLDivElement>(null);
  const [planoPdfFile, setPlanoPdfFile] = useState<File | null>(null);
  const [planoDwgFile, setPlanoDwgFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Partial<Cruce>>({
    nombre: '',
    codigo: '',
    latitud: -12.0464,
    longitud: -77.0428,
    ubigeoId: '150101',
    tipoGestion: 1,
    proyectoId: 1,
    via1: 1,
    via2: 1,
    estado: true,
  });

  useEffect(() => {
    loadTipos();
    loadAdministradores();
    loadUbigeos();
    loadEjes();
    if (isEdit && id) {
      loadCruce();
    }
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (distritoRef.current && !distritoRef.current.contains(event.target as Node)) {
        setShowDistritoDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Actualizar nombre cuando cambian via1 o via2
  useEffect(() => {
    if (formData.via1 && formData.via2) {
      const via1Obj = ejes.find(e => e.id === formData.via1);
      const via2Obj = ejes.find(e => e.id === formData.via2);
      if (via1Obj && via2Obj) {
        setFormData(prev => ({
          ...prev,
          nombre: `${via1Obj.nombreVia} CON ${via2Obj.nombreVia}`
        }));
      }
    }
  }, [formData.via1, formData.via2, ejes]);

  const loadTipos = async () => {
    try {
      const data = await tiposService.getTipos();
      setTipos(data);
    } catch (error) {
      console.error('Error loading tipos:', error);
    }
  };

  const loadAdministradores = async () => {
    try {
      const data = await administradoresService.getAdministradores();
      setAdministradores(data);
    } catch (error) {
      console.error('Error loading administradores:', error);
    }
  };

  const loadUbigeos = async () => {
    try {
      const data = await ubigeosService.getUbigeos();
      setUbigeos(data);
    } catch (error) {
      console.error('Error loading ubigeos:', error);
    }
  };

  const loadEjes = async () => {
    try {
      const data = await ejesService.getEjes();
      setEjes(data);
    } catch (error) {
      console.error('Error loading ejes:', error);
    }
  };

  const getTiposByParent = (parentId: number | null) => {
    return tipos.filter(t => t.parent_id === parentId && t.estado);
  };

  const handleMapPositionChange = (position: [number, number]) => {
    setFormData(prev => ({
      ...prev,
      latitud: Number(position[0].toFixed(6)),
      longitud: Number(position[1].toFixed(6)),
    }));
  };

  const getFilteredUbigeos = () => {
    const search = distritoSearch.toLowerCase().trim();
    if (!search) {
      return ubigeos.slice(0, 50);
    }
    return ubigeos.filter(u => 
      u.distrito?.toLowerCase().includes(search) ||
      u.provincia?.toLowerCase().includes(search) ||
      u.region?.toLowerCase().includes(search)
    ).slice(0, 50);
  };

  const handleDistritoSelect = (ubigeo: any) => {
    setFormData(prev => ({ ...prev, ubigeoId: ubigeo.id }));
    setDistritoSearch(`${ubigeo.distrito} - ${ubigeo.provincia}`);
    setShowDistritoDropdown(false);
  };

  const loadCruce = async () => {
    try {
      setLoading(true);
      const cruce = await crucesService.getCruce(id!);
      
      const rawLat = cruce.latitud;
      const rawLng = cruce.longitud;
      const validCoords = rawLat !== null && rawLat !== undefined && rawLat !== '' && !isNaN(Number(rawLat)) &&
                          rawLng !== null && rawLng !== undefined && rawLng !== '' && !isNaN(Number(rawLng));
      
      setHasOriginalCoords(validCoords);

      const finalLat = validCoords ? Number(rawLat) : -12.0464;
      const finalLng = validCoords ? Number(rawLng) : -77.0428;

      setFormData({
        ubigeoId: cruce.ubigeoId,
        tipoGestion: cruce.tipoGestion,
        administradorId: cruce.administradorId,
        proyectoId: cruce.proyectoId,
        via1: cruce.via1,
        via2: cruce.via2,
        tipoComunicacion: cruce.tipoComunicacion,
        estado: cruce.estado,
        tipoCruce: cruce.tipoCruce,
        tipoEstructura: cruce.tipoEstructura,
        tipoOperacion: cruce.tipoOperacion,
        anoImplementacion: cruce.anoImplementacion,
        observaciones: cruce.observaciones,
        nombre: cruce.nombre,
        latitud: finalLat,
        longitud: finalLng,
        codigo: cruce.codigo,
        tipoControl: cruce.tipoControl,
        codigoAnterior: cruce.codigoAnterior,
        usuarioRegistra: cruce.usuarioRegistra,
        electricoEmpresa: cruce.electricoEmpresa,
        electricoSuministro: cruce.electricoSuministro,
      });
      
      if (cruce.ubigeo) {
        const displayText = cruce.ubigeo.provincia 
          ? `${cruce.ubigeo.distrito} - ${cruce.ubigeo.provincia}`
          : cruce.ubigeo.distrito || '';
        setDistritoSearch(displayText);
      }
    } catch (error) {
      console.error('Error loading cruce:', error);
      toast.error('Error al cargar la información de la intersección');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    const numericFields = ['tipoCruce', 'tipoGestion', 'tipoComunicacion', 'tipoControl', 
                           'tipoEstructura', 'administradorId', 'proyectoId', 
                           'via1', 'via2', 'anoImplementacion'];
    
    let finalValue: any = value;
    
    if (type === 'checkbox') {
      finalValue = checked;
    } else if (type === 'number') {
      finalValue = value === '' ? undefined : parseFloat(value);
    } else if (numericFields.includes(name) && value !== '') {
      finalValue = parseInt(value, 10);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre || formData.latitud === undefined || formData.longitud === undefined) {
      toast.error('Por favor complete todos los campos requeridos (*)');
      return;
    }

    try {
      setLoading(true);
      
      const allowedFields = [
        'ubigeoId', 'tipoGestion', 'administradorId', 'proyectoId', 'via1', 'via2',
        'tipoComunicacion', 'estado', 'tipoCruce', 'tipoEstructura', 'tipoOperacion',
        'anoImplementacion', 'observaciones', 'nombre', 'latitud', 'longitud', 'codigo',
        'tipoControl', 'codigoAnterior', 'usuarioRegistra', 'electricoEmpresa', 'electricoSuministro'
      ];

      const extractAllowedFields = (data: any) => {
        const cleaned: any = {};
        allowedFields.forEach(field => {
          if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
            let value = data[field];
            
            const numericFields = ['tipoGestion', 'administradorId', 'proyectoId', 'via1', 'via2', 
                                   'tipoComunicacion', 'tipoCruce', 'tipoEstructura',
                                   'anoImplementacion', 'tipoControl', 'latitud', 'longitud'];
            if (numericFields.includes(field)) {
              value = typeof value === 'string' ? parseFloat(value) : Number(value);
            }
            
            if (field === 'estado') {
              value = value === true || value === 'true' || value === 1 || value === '1';
            }
            
            cleaned[field] = value;
          }
        });
        return cleaned;
      };
      
      if (planoPdfFile || planoDwgFile) {
        const formDataToSend = new FormData();
        
        const cleanedData = extractAllowedFields(formData);
        Object.keys(cleanedData).forEach(key => {
          const value = cleanedData[key];
          if (typeof value === 'boolean') {
            formDataToSend.append(key, value ? 'true' : 'false');
          } else {
            formDataToSend.append(key, String(value));
          }
        });
        
        if (planoPdfFile) {
          formDataToSend.append('planoPdf', planoPdfFile);
        }
        if (planoDwgFile) {
          formDataToSend.append('planoDwg', planoDwgFile);
        }

        if (isEdit) {
          await crucesService.updateCruceWithFiles(id!, formDataToSend);
          toast.success('Intersección actualizada exitosamente');
        } else {
          await crucesService.createCruceWithFiles(formDataToSend);
          toast.success('Intersección registrada exitosamente');
        }
      } else {
        const cleanedData = extractAllowedFields(formData);
        if (isEdit) {
          await crucesService.updateCruce(id!, cleanedData);
          toast.success('Intersección actualizada exitosamente');
        } else {
          await crucesService.createCruce(cleanedData);
          toast.success('Intersección registrada exitosamente');
        }
      }
      
      if (onSave) onSave();
      if (onClose) onClose();
      else navigate('/cruces');
    } catch (error: any) {
      console.error('Error saving cruce:', error);
      toast.error(error.response?.data?.message || 'Error al guardar la intersección');
    } finally {
      setLoading(false);
    }
  };

  const validLat = (formData.latitud !== undefined && formData.latitud !== null && !isNaN(Number(formData.latitud)))
    ? Number(formData.latitud)
    : -12.0464;
  const validLng = (formData.longitud !== undefined && formData.longitud !== null && !isNaN(Number(formData.longitud)))
    ? Number(formData.longitud)
    : -77.0428;
  const currentPos: [number, number] = [validLat, validLng];

  return (
    <form className="px-2 py-3" onSubmit={handleSubmit}>
      <div className="row g-3">
        <div className="col-12">
          <h5 className="fw-bold mb-3 text-dark">
            <i className="fa-solid fa-traffic-light me-2 text-primary"></i>
            {isEdit ? 'Editar Intersección' : 'Nueva Intersección'}
          </h5>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold small text-secondary">Vía 1 <span className="text-danger">*</span></label>
          <Select
            options={[
              { value: '', label: 'Seleccione vía 1...' },
              ...ejes.map(eje => ({ value: eje.id, label: eje.nombreVia }))
            ]}
            value={formData.via1 ? ejes.find(e => e.id === formData.via1) ? { value: formData.via1, label: ejes.find(e => e.id === formData.via1)?.nombreVia || '' } : null : null}
            onChange={(option) => setFormData({ ...formData, via1: option?.value as number || undefined })}
            isClearable
            styles={customSelectStyles}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold small text-secondary">Vía 2 <span className="text-danger">*</span></label>
          <Select
            options={[
              { value: '', label: 'Seleccione vía 2...' },
              ...ejes.map(eje => ({ value: eje.id, label: eje.nombreVia }))
            ]}
            value={formData.via2 ? ejes.find(e => e.id === formData.via2) ? { value: formData.via2, label: ejes.find(e => e.id === formData.via2)?.nombreVia || '' } : null : null}
            onChange={(option) => setFormData({ ...formData, via2: option?.value as number || undefined })}
            isClearable
            styles={customSelectStyles}
            required
          />
        </div>
        <div className="col-12">
          <label className="form-label fw-semibold small text-secondary">Nombre de la Intersección <span className="text-danger">*</span></label>
          <input
            type="text"
            className="form-control custom-input"
            name="nombre"
            value={formData.nombre || ''}
            onChange={handleChange}
            required
            placeholder="Se genera automáticamente al seleccionar las vías"
            readOnly
            style={{ backgroundColor: '#f8f9fa' }}
          />
          <small className="text-muted">El nombre se genera automáticamente como: VÍA 1 CON VÍA 2</small>
        </div>
        <div className="col-md-12">
          <label className="form-label fw-semibold small text-secondary">Código</label>
          <input
            type="text"
            className="form-control custom-input"
            name="codigo"
            value={formData.codigo || ''}
            onChange={handleChange}
            placeholder="Ej: C001"
          />
        </div>
        <div className="col-12 mt-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h6 className="fw-bold mb-0 text-dark">
              <i className="fa-solid fa-map-location-dot me-2 text-primary"></i>
              Ubicación Geográfica
            </h6>
            {!hasOriginalCoords && isEdit && (
              <span className="badge bg-warning text-dark border">
                <i className="fa-solid fa-triangle-exclamation me-1"></i>
                Sin coordenadas previas en BD (Centrado inicial sugerido en Lima)
              </span>
            )}
          </div>
        </div>
        <div className="col-12">
          <label className="form-label fw-semibold small text-secondary">
            Ubicación en Mapa <span className="text-danger">*</span>
          </label>
          <div style={{ height: '320px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #dee2e6', position: 'relative' }}>
            <MapContainer
              center={currentPos}
              zoom={16}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <DraggableMarker
                position={currentPos}
                setPosition={handleMapPositionChange}
              />
              <MapClickHandler setPosition={handleMapPositionChange} />
              <MapUpdater center={currentPos} />
              <MapResizer />
            </MapContainer>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-1">
            <small className="text-muted">
              <i className="fa-solid fa-circle-info me-1 text-primary"></i>
              Arrastra el marcador o haz clic en el mapa para fijar las coordenadas exactas.
            </small>
            <button
              type="button"
              className="btn btn-sm btn-link text-decoration-none py-0 px-1 text-primary"
              onClick={() => handleMapPositionChange([-12.0464, -77.0428])}
              title="Centrar en Lima Centro"
            >
              <i className="fa-solid fa-location-crosshairs me-1"></i>
              Centrar en Lima
            </button>
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold small text-secondary">Latitud <span className="text-danger">*</span></label>
          <input
            type="number"
            className="form-control custom-input"
            name="latitud"
            value={formData.latitud !== undefined && formData.latitud !== null ? formData.latitud : ''}
            onChange={handleChange}
            required
            step="any"
            min="-90"
            max="90"
          />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold small text-secondary">Longitud <span className="text-danger">*</span></label>
          <input
            type="number"
            className="form-control custom-input"
            name="longitud"
            value={formData.longitud !== undefined && formData.longitud !== null ? formData.longitud : ''}
            onChange={handleChange}
            required
            step="any"
            min="-180"
            max="180"
          />
        </div>
        <div className="col-12 mt-3">
          <h6 className="fw-bold mb-2 text-dark">
            <i className="fa-solid fa-info-circle me-2 text-primary"></i>
            Información General
          </h6>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold small text-secondary">Código Anterior</label>
          <input
            type="text"
            className="form-control custom-input"
            name="codigoAnterior"
            value={formData.codigoAnterior || ''}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold small text-secondary">Distrito</label>
          <div className="position-relative" ref={distritoRef}>
            <input
              type="text"
              className="form-control custom-input"
              value={distritoSearch}
              onChange={(e) => {
                setDistritoSearch(e.target.value);
                setShowDistritoDropdown(true);
              }}
              onFocus={() => setShowDistritoDropdown(true)}
              placeholder="Buscar distrito..."
              autoComplete="off"
            />
            {showDistritoDropdown && getFilteredUbigeos().length > 0 && (
              <div 
                className="position-absolute w-100 mt-1 bg-white border rounded shadow-sm" 
                style={{ 
                  zIndex: 1000, 
                  maxHeight: '200px', 
                  overflowY: 'auto'
                }}
              >
                {getFilteredUbigeos().map(ubigeo => (
                  <div
                    key={ubigeo.id}
                    className="px-3 py-2 border-bottom"
                    style={{ cursor: 'pointer' }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleDistritoSelect(ubigeo);
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <div className="fw-bold" style={{ fontSize: '0.9rem' }}>{ubigeo.distrito}</div>
                    <small className="text-muted">{ubigeo.provincia} - {ubigeo.region}</small>
                  </div>
                ))}
              </div>
            )}
          </div>
          {formData.ubigeoId && (
            <small className="text-muted d-block mt-1">Código: {formData.ubigeoId}</small>
          )}
        </div>
        <div className="col-12 mt-3">
          <h6 className="fw-bold mb-2 text-dark">
            <i className="fa-solid fa-layer-group me-2 text-primary"></i>
            Tipos y Clasificación
          </h6>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold small text-secondary">Tipo de Intersección</label>
          <Select
            options={[
              { value: '', label: 'Seleccione...' },
              ...getTiposByParent(1).map(tipo => ({ value: tipo.id, label: tipo.name }))
            ]}
            value={formData.tipoCruce ? getTiposByParent(1).find(t => t.id === formData.tipoCruce) ? { value: formData.tipoCruce, label: getTiposByParent(1).find(t => t.id === formData.tipoCruce)?.name || '' } : null : null}
            onChange={(option) => setFormData({ ...formData, tipoCruce: option?.value as number || undefined })}
            isClearable
            styles={customSelectStyles}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold small text-secondary">Tipo de Gestión</label>
          <Select
            options={[
              { value: '', label: 'Seleccione...' },
              ...getTiposByParent(4).map(tipo => ({ value: tipo.id, label: tipo.name }))
            ]}
            value={formData.tipoGestion ? getTiposByParent(4).find(t => t.id === formData.tipoGestion) ? { value: formData.tipoGestion, label: getTiposByParent(4).find(t => t.id === formData.tipoGestion)?.name || '' } : null : null}
            onChange={(option) => setFormData({ ...formData, tipoGestion: option?.value as number || undefined })}
            isClearable
            styles={customSelectStyles}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold small text-secondary">Tipo de Comunicación</label>
          <Select
            options={[
              { value: '', label: 'Seleccione...' },
              ...getTiposByParent(9).map(tipo => ({ value: tipo.id, label: tipo.name }))
            ]}
            value={formData.tipoComunicacion ? getTiposByParent(9).find(t => t.id === formData.tipoComunicacion) ? { value: formData.tipoComunicacion, label: getTiposByParent(9).find(t => t.id === formData.tipoComunicacion)?.name || '' } : null : null}
            onChange={(option) => setFormData({ ...formData, tipoComunicacion: option?.value as number || undefined })}
            isClearable
            styles={customSelectStyles}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold small text-secondary">Tipo de Control</label>
          <Select
            options={[
              { value: '', label: 'Seleccione...' },
              ...getTiposByParent(30).map(tipo => ({ value: tipo.id, label: tipo.name }))
            ]}
            value={formData.tipoControl ? getTiposByParent(30).find(t => t.id === formData.tipoControl) ? { value: formData.tipoControl, label: getTiposByParent(30).find(t => t.id === formData.tipoControl)?.name || '' } : null : null}
            onChange={(option) => setFormData({ ...formData, tipoControl: option?.value as number || undefined })}
            isClearable
            styles={customSelectStyles}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold small text-secondary">Tipo de Estructura</label>
          <Select
            options={[
              { value: '', label: 'Seleccione...' },
              ...getTiposByParent(19).map(tipo => ({ value: tipo.id, label: tipo.name }))
            ]}
            value={formData.tipoEstructura ? getTiposByParent(19).find(t => t.id === formData.tipoEstructura) ? { value: formData.tipoEstructura, label: getTiposByParent(19).find(t => t.id === formData.tipoEstructura)?.name || '' } : null : null}
            onChange={(option) => setFormData({ ...formData, tipoEstructura: option?.value as number || undefined })}
            isClearable
            styles={customSelectStyles}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold small text-secondary">Tipo de Operación</label>
          <Select
            options={[
              { value: '', label: 'Seleccione...' },
              ...getTiposByParent(23).map(tipo => ({ value: tipo.id, label: tipo.name }))
            ]}
            value={formData.tipoOperacion ? getTiposByParent(23).find(t => t.id === formData.tipoOperacion) ? { value: formData.tipoOperacion, label: getTiposByParent(23).find(t => t.id === formData.tipoOperacion)?.name || '' } : null : null}
            onChange={(option) => setFormData({ ...formData, tipoOperacion: option?.value as number || undefined })}
            isClearable
            styles={customSelectStyles}
          />
        </div>
        <div className="col-12 mt-3">
          <h6 className="fw-bold mb-2 text-dark">
            <i className="fa-solid fa-sliders me-2 text-primary"></i>
            Configuración Adicional
          </h6>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold small text-secondary">Año de Implementación</label>
          <input
            type="number"
            className="form-control custom-input"
            name="anoImplementacion"
            value={formData.anoImplementacion || ''}
            onChange={handleChange}
            min="1900"
            max="2100"
          />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold small text-secondary">Administrador</label>
          <Select
            options={[
              { value: '', label: 'Seleccionar administrador...' },
              ...administradores.map(admin => ({ value: admin.id, label: admin.nombre }))
            ]}
            value={formData.administradorId ? administradores.find(a => a.id === formData.administradorId) ? { value: formData.administradorId, label: administradores.find(a => a.id === formData.administradorId)?.nombre || '' } : null : null}
            onChange={(option) => setFormData({ ...formData, administradorId: option?.value as number || undefined })}
            isClearable
            styles={customSelectStyles}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold small text-secondary">Empresa Eléctrica</label>
          <input
            type="text"
            className="form-control custom-input"
            name="electricoEmpresa"
            value={formData.electricoEmpresa || ''}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold small text-secondary">Suministro Eléctrico</label>
          <input
            type="text"
            className="form-control custom-input"
            name="electricoSuministro"
            value={formData.electricoSuministro || ''}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold small text-secondary">
            <i className="fa-solid fa-file-pdf me-2 text-danger"></i>
            Plano PDF
          </label>
          <input
            type="file"
            className="form-control custom-input"
            accept=".pdf"
            onChange={(e) => setPlanoPdfFile(e.target.files?.[0] || null)}
          />
          {formData.planoPdf && (
            <small className="text-muted d-block mt-1">
              Archivo actual: {formData.planoPdf}
            </small>
          )}
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold small text-secondary">
            <i className="fa-solid fa-compass-drafting me-2 text-primary"></i>
            Plano DWG
          </label>
          <input
            type="file"
            className="form-control custom-input"
            accept=".dwg"
            onChange={(e) => setPlanoDwgFile(e.target.files?.[0] || null)}
          />
          {formData.planoDwg && (
            <small className="text-muted d-block mt-1">
              Archivo actual: {formData.planoDwg}
            </small>
          )}
        </div>
        <div className="col-12">
          <label className="form-label fw-semibold small text-secondary">Observaciones</label>
          <textarea
            className="form-control custom-textarea"
            name="observaciones"
            value={formData.observaciones || ''}
            onChange={handleChange}
            rows={3}
          />
        </div>
        <div className="col-md-6">
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              name="estado"
              id="estado"
              checked={formData.estado || false}
              onChange={handleChange}
            />
            <label className="form-check-label fw-semibold small" htmlFor="estado">
              Estado Activo
            </label>
          </div>
        </div>
        <div className="col-12 mt-4 d-flex gap-2 justify-content-end">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm px-3"
            onClick={() => onClose ? onClose() : navigate('/cruces')}
            disabled={loading}
          >
            <i className="fa-solid fa-xmark me-2"></i>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-sm px-3"
            disabled={loading}
          >
            <i className="fa-solid fa-floppy-disk me-2"></i>
            {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Guardar')}
          </button>
        </div>
      </div>
    </form>
  );
}
