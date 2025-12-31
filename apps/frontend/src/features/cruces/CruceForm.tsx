import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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
    map.setView(center, map.getZoom());
  }, [center, map]);
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
      latitud: position[0],
      longitud: position[1],
    }));
  };

  const getFilteredUbigeos = () => {
    const search = distritoSearch.toLowerCase().trim();
    if (!search) {
      return ubigeos.slice(0, 50); // Mostrar primeros 50 cuando no hay búsqueda
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
      
      // Extraer solo los campos permitidos del cruce
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
        latitud: typeof cruce.latitud === 'string' ? parseFloat(cruce.latitud) : cruce.latitud,
        longitud: typeof cruce.longitud === 'string' ? parseFloat(cruce.longitud) : cruce.longitud,
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
      alert('Error al cargar el cruce');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    // Campos que deben ser numéricos
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

    if (!formData.nombre || !formData.latitud || !formData.longitud) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    try {
      setLoading(true);
      
      // Campos permitidos según el DTO
      const allowedFields = [
        'ubigeoId', 'tipoGestion', 'administradorId', 'proyectoId', 'via1', 'via2',
        'tipoComunicacion', 'estado', 'tipoCruce', 'tipoEstructura', 'tipoOperacion',
        'anoImplementacion', 'observaciones', 'nombre', 'latitud', 'longitud', 'codigo',
        'tipoControl', 'codigoAnterior', 'usuarioRegistra', 'electricoEmpresa', 'electricoSuministro'
      ];

      // Función para extraer solo los campos permitidos y convertir tipos
      const extractAllowedFields = (data: any) => {
        const cleaned: any = {};
        allowedFields.forEach(field => {
          if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
            let value = data[field];
            
            // Convertir a número campos numéricos
            const numericFields = ['tipoGestion', 'administradorId', 'proyectoId', 'via1', 'via2', 
                                   'tipoComunicacion', 'tipoCruce', 'tipoEstructura',
                                   'anoImplementacion', 'tipoControl', 'latitud', 'longitud'];
            if (numericFields.includes(field)) {
              value = typeof value === 'string' ? parseFloat(value) : Number(value);
            }
            
            // Convertir a boolean campo estado
            if (field === 'estado') {
              value = value === true || value === 'true' || value === 1 || value === '1';
            }
            
            cleaned[field] = value;
          }
        });
        return cleaned;
      };
      
      // Si hay archivos, usar FormData
      if (planoPdfFile || planoDwgFile) {
        const formDataToSend = new FormData();
        
        // Agregar solo los campos permitidos y ya convertidos
        const cleanedData = extractAllowedFields(formData);
        Object.keys(cleanedData).forEach(key => {
          const value = cleanedData[key];
          // FormData requiere strings, pero el backend hará la conversión
          if (typeof value === 'boolean') {
            formDataToSend.append(key, value ? 'true' : 'false');
          } else {
            formDataToSend.append(key, String(value));
          }
        });
        
        // Agregar archivos si existen
        if (planoPdfFile) {
          formDataToSend.append('planoPdf', planoPdfFile);
        }
        if (planoDwgFile) {
          formDataToSend.append('planoDwg', planoDwgFile);
        }

        if (isEdit) {
          await crucesService.updateCruceWithFiles(id!, formDataToSend);
          alert('Cruce actualizado exitosamente');
        } else {
          await crucesService.createCruceWithFiles(formDataToSend);
          alert('Cruce creado exitosamente');
        }
      } else {
        // Sin archivos, usar JSON normal con datos limpios
        const cleanedData = extractAllowedFields(formData);
        if (isEdit) {
          await crucesService.updateCruce(id!, cleanedData);
          alert('Cruce actualizado exitosamente');
        } else {
          await crucesService.createCruce(cleanedData);
          alert('Cruce creado exitosamente');
        }
      }
      
      if (onSave) onSave();
      if (onClose) onClose();
      else navigate('/cruces');
    } catch (error: any) {
      console.error('Error saving cruce:', error);
      alert(error.response?.data?.message || 'Error al guardar el cruce');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="px-2 py-3" onSubmit={handleSubmit}>
      <div className="row g-3">
        <div className="col-12">
          <h5 className="fw-bold mb-3">
            <i className="fas fa-traffic-light me-2"></i>
            {isEdit ? 'Editar Cruce' : 'Nuevo Cruce'}
          </h5>
        </div>
        <div className="col-md-6">
          <label className="form-label">Vía 1 <span className="text-danger">*</span></label>
          <select
            className="form-select"
            name="via1"
            value={formData.via1 || ''}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione vía 1...</option>
            {ejes.map(eje => (
              <option key={eje.id} value={eje.id}>{eje.nombreVia}</option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Vía 2 <span className="text-danger">*</span></label>
          <select
            className="form-select"
            name="via2"
            value={formData.via2 || ''}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione vía 2...</option>
            {ejes.map(eje => (
              <option key={eje.id} value={eje.id}>{eje.nombreVia}</option>
            ))}
          </select>
        </div>
        <div className="col-12">
          <label className="form-label">Nombre del Cruce <span className="text-danger">*</span></label>
          <input
            type="text"
            className="form-control"
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
          <label className="form-label">Código</label>
          <input
            type="text"
            className="form-control"
            name="codigo"
            value={formData.codigo || ''}
            onChange={handleChange}
            placeholder="Ej: C001"
          />
        </div>
        <div className="col-12 mt-3">
          <h6 className="fw-bold mb-2">Ubicación Geográfica</h6>
        </div>
        <div className="col-12">
          <label className="form-label">Ubicación en Mapa <span className="text-danger">*</span></label>
          <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #dee2e6' }}>
            {formData.latitud && formData.longitud && (
              <MapContainer
                center={[formData.latitud, formData.longitud]}
                zoom={17}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <DraggableMarker
                  position={[formData.latitud, formData.longitud]}
                  setPosition={handleMapPositionChange}
                />
                <MapClickHandler setPosition={handleMapPositionChange} />
                <MapUpdater center={[formData.latitud, formData.longitud]} />
              </MapContainer>
            )}
          </div>
          <small className="text-muted">Arrastra el marcador o haz clic en el mapa para cambiar la ubicación</small>
        </div>
        <div className="col-md-6">
          <label className="form-label">Latitud <span className="text-danger">*</span></label>
          <input
            type="number"
            className="form-control"
            name="latitud"
            value={formData.latitud || ''}
            onChange={handleChange}
            required
            step="any"
            min="-90"
            max="90"
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Longitud <span className="text-danger">*</span></label>
          <input
            type="number"
            className="form-control"
            name="longitud"
            value={formData.longitud || ''}
            onChange={handleChange}
            required
            step="any"
            min="-180"
            max="180"
          />
        </div>
        <div className="col-12 mt-3">
          <h6 className="fw-bold mb-2">Información General</h6>
        </div>
        <div className="col-md-6">
          <label className="form-label">Código Anterior</label>
          <input
            type="text"
            className="form-control"
            name="codigoAnterior"
            value={formData.codigoAnterior || ''}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Distrito</label>
          <div className="position-relative" ref={distritoRef}>
            <input
              type="text"
              className="form-control"
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
          <h6 className="fw-bold mb-2">Tipos y Clasificación</h6>
        </div>
        <div className="col-md-6">
          <label className="form-label">Tipo de Cruce</label>
          <select
            className="form-select"
            name="tipoCruce"
            value={formData.tipoCruce || ''}
            onChange={handleChange}
          >
            <option value="">Seleccione...</option>
            {getTiposByParent(1).map(tipo => (
              <option key={tipo.id} value={tipo.id}>{tipo.name}</option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Tipo de Gestión</label>
          <select
            className="form-select"
            name="tipoGestion"
            value={formData.tipoGestion || ''}
            onChange={handleChange}
          >
            <option value="">Seleccione...</option>
            {getTiposByParent(4).map(tipo => (
              <option key={tipo.id} value={tipo.id}>{tipo.name}</option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Tipo de Comunicación</label>
          <select
            className="form-select"
            name="tipoComunicacion"
            value={formData.tipoComunicacion || ''}
            onChange={handleChange}
          >
            <option value="">Seleccione...</option>
            {getTiposByParent(9).map(tipo => (
              <option key={tipo.id} value={tipo.id}>{tipo.name}</option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Tipo de Control</label>
          <select
            className="form-select"
            name="tipoControl"
            value={formData.tipoControl || ''}
            onChange={handleChange}
          >
            <option value="">Seleccione...</option>
            {getTiposByParent(30).map(tipo => (
              <option key={tipo.id} value={tipo.id}>{tipo.name}</option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Tipo de Estructura</label>
          <select
            className="form-select"
            name="tipoEstructura"
            value={formData.tipoEstructura || ''}
            onChange={handleChange}
          >
            <option value="">Seleccione...</option>
            {getTiposByParent(19).map(tipo => (
              <option key={tipo.id} value={tipo.id}>{tipo.name}</option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Tipo de Operación</label>
          <select
            className="form-select"
            name="tipoOperacion"
            value={formData.tipoOperacion || ''}
            onChange={handleChange}
          >
            <option value="">Seleccione...</option>
            {getTiposByParent(23).map(tipo => (
              <option key={tipo.id} value={tipo.id}>{tipo.name}</option>
            ))}
          </select>
        </div>
        <div className="col-12 mt-3">
          <h6 className="fw-bold mb-2">Configuración Adicional</h6>
        </div>
        <div className="col-md-6">
          <label className="form-label">Año de Implementación</label>
          <input
            type="number"
            className="form-control"
            name="anoImplementacion"
            value={formData.anoImplementacion || ''}
            onChange={handleChange}
            min="1900"
            max="2100"
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Administrador</label>
          <select
            className="form-select"
            name="administradorId"
            value={formData.administradorId || ''}
            onChange={handleChange}
          >
            <option value="">Seleccionar administrador...</option>
            {administradores.map(admin => (
              <option key={admin.id} value={admin.id}>{admin.nombre}</option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Empresa Eléctrica</label>
          <input
            type="text"
            className="form-control"
            name="electricoEmpresa"
            value={formData.electricoEmpresa || ''}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Suministro Eléctrico</label>
          <input
            type="text"
            className="form-control"
            name="electricoSuministro"
            value={formData.electricoSuministro || ''}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">
            <i className="fas fa-file-pdf me-2 text-danger"></i>
            Plano PDF
          </label>
          <input
            type="file"
            className="form-control"
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
          <label className="form-label">
            <i className="fas fa-drafting-compass me-2 text-primary"></i>
            Plano DWG
          </label>
          <input
            type="file"
            className="form-control"
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
          <label className="form-label">Observaciones</label>
          <textarea
            className="form-control"
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
            <label className="form-check-label" htmlFor="estado">
              Estado Activo
            </label>
          </div>
        </div>
        <div className="col-12 mt-4 d-flex gap-2 justify-content-end">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => onClose ? onClose() : navigate('/cruces')}
            disabled={loading}
          >
            <i className="fas fa-times me-2"></i>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            <i className="fas fa-save me-2"></i>
            {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Guardar')}
          </button>
        </div>
      </div>
    </form>
  );
}
