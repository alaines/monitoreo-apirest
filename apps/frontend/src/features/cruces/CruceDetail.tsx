
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getMapImage } from '../../utils/getMapImage';
import { useNavigate, useParams } from 'react-router-dom';
import { crucesService, perifericosService, Cruce, Periferico, CrucePeriferico } from '../../services/cruces.service';
import { tiposService, Tipo } from '../../services/tipos.service';

interface CruceDetailProps {
  cruceId?: number;
  onClose?: () => void;
}

export function CruceDetail({ cruceId, onClose }: CruceDetailProps) {
    // Exportar ficha PDF
    const handleExportPDF = async () => {
      if (!cruce) return;
      const doc = new jsPDF();

      // Utilidades para mostrar nombre de tipo
      const getTipoNombrePDF = (id: number | undefined | null) => {
        if (!id) return 'N/A';
        const tipo = tipos.find(t => t.id === id);
        return tipo?.name || 'N/A';
      };

      // Encabezado
      doc.setFontSize(18);
      doc.text('Sistema de Monitoreo de Semáforos', 105, 15, { align: 'center' });

      doc.setFontSize(13);
      doc.text('Ficha de Cruce', 105, 24, { align: 'center' });
      if (cruce.nombre) {
        doc.setFontSize(12);
        doc.text(cruce.nombre, 105, 32, { align: 'center' });
      }
      doc.setLineWidth(0.5);
      doc.line(10, 36, 200, 36);
      let y = 42;

      // Footer con número de página
      const addFooter = (doc) => {
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(9);
          doc.text(`Página ${i} de ${pageCount}`, 200 - 20, 290, { align: 'right' });
        }
      };

      // Mapa centrado, tamaño más pequeño y zoom ajustado
      if (cruce.latitud && cruce.longitud) {
        try {
          const pageWidth = doc.internal.pageSize.getWidth();
          const margin = 14;
          const mapWidthMM = Math.min(pageWidth - margin * 2, 120); // máximo 120mm de ancho
          const mapHeightMM = Math.round(mapWidthMM * 0.6); // relación 5:3
          // Convertir mm a píxeles para la API (1mm ≈ 3.78px a 96 DPI)
          const mapWidthPx = Math.round(mapWidthMM * 4);
          const mapHeightPx = Math.round(mapHeightMM * 4);
          const mapImg = await getMapImage({ 
            lat: cruce.latitud, 
            lng: cruce.longitud, 
            width: mapWidthPx, 
            height: mapHeightPx, 
            zoom: 16 
          });
          const x = (pageWidth - mapWidthMM) / 2;
          doc.text('Ubicación:', pageWidth / 2, y, { align: 'center' });
          doc.addImage(mapImg.dataUrl, mapImg.type, x, y + 2, mapWidthMM, mapHeightMM);
          y += mapHeightMM + 8;
        } catch (e) {
          doc.text('No se pudo cargar el mapa.', 14, y);
          y += 8;
        }
      }

      // Detalle principal - organizando en dos columnas para optimizar espacio
      const detalleIzq = [
        ['Código', cruce.codigo || 'N/A'],
        ['Código Anterior', cruce.codigoAnterior || 'N/A'],
        ['Distrito', cruce.ubigeo?.distrito || cruce.ubigeoId || 'N/A'],
        ['Tipo de Cruce', getTipoNombrePDF(cruce.tipoCruce)],
        ['Tipo de Gestión', getTipoNombrePDF(cruce.tipoGestion)],
        ['Tipo de Control', getTipoNombrePDF(cruce.tipoControl)],
        ['Tipo de Operación', getTipoNombrePDF(cruce.tipoOperacion)],
        ['Tipo de Comunicación', getTipoNombrePDF(cruce.tipoComunicacion)],
      ];

      const detalleDer = [
        ['Tipo de Estructura', getTipoNombrePDF(cruce.tipoEstructura)],
        ['Administrador', cruce.administrador?.nombre || 'N/A'],
        ['Año Implementación', cruce.anoImplementacion || 'N/A'],
        ['Empresa Eléctrica', cruce.electricoEmpresa || 'N/A'],
        ['N° de Suministro', cruce.electricoSuministro || 'N/A'],
        ['Latitud', cruce.latitud || 'N/A'],
        ['Longitud', cruce.longitud || 'N/A'],
      ];

      // Tabla en dos columnas
      const pageWidth = doc.internal.pageSize.getWidth();
      const columnWidth = (pageWidth - 30) / 2;
      
      autoTable(doc, {
        startY: y,
        head: [['Campo', 'Valor']],
        body: detalleIzq,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 9, cellPadding: 2 },
        tableWidth: columnWidth,
        margin: { left: 14 },
      });

      autoTable(doc, {
        startY: y,
        head: [['Campo', 'Valor']],
        body: detalleDer,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 9, cellPadding: 2 },
        tableWidth: columnWidth,
        margin: { left: 14 + columnWidth + 2 },
      });

      y = Math.max(doc.lastAutoTable.finalY) + 6;

      // Observaciones (si existen)
      if (cruce.observaciones) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Observaciones:', 14, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const observacionesLines = doc.splitTextToSize(cruce.observaciones, pageWidth - 28);
        doc.text(observacionesLines, 14, y + 5);
        y += 5 + (observacionesLines.length * 4);
      }

      // Periféricos en nueva página
      if (perifericos.length > 0) {
        doc.addPage();
        y = 20;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Periféricos Instalados', 14, y);
        doc.setFont('helvetica', 'normal');
        y += 8;
        
        autoTable(doc, {
          startY: y,
          head: [['Tipo', 'Fabricante', 'Modelo', 'N° Serie', 'IP', 'Estado', 'Garantía']],
          body: perifericos.map(cp => [
            getTipoNombrePDF(cp.periferico?.tipoPeriferico),
            cp.periferico?.fabricante || 'N/A',
            cp.periferico?.modelo || 'N/A',
            cp.periferico?.numeroSerie || 'N/A',
            cp.periferico?.ip || 'N/A',
            cp.periferico?.estado || 'N/A',
            cp.periferico?.enGarantia ? 'Sí' : 'No',
          ]),
          theme: 'striped',
          headStyles: { fillColor: [39, 174, 96], fontSize: 9 },
          styles: { fontSize: 8, cellPadding: 2 },
        });
      }

      addFooter(doc);
      doc.save(`ficha-cruce-${cruce.codigo || cruce.id}.pdf`);
    };
  const navigate = useNavigate();
  const params = useParams();
  const id = cruceId ?? (params.id ? parseInt(params.id) : undefined);
  const [cruce, setCruce] = useState<Cruce | null>(null);
  const [loading, setLoading] = useState(true);
  const [perifericos, setPerifericos] = useState<CrucePeriferico[]>([]);
  const [availablePerifericos, setAvailablePerifericos] = useState<Periferico[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPeriferico, setSelectedPeriferico] = useState<number | null>(null);
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [planoModalOpen, setPlanoModalOpen] = useState(false);
  const [selectedPlano, setSelectedPlano] = useState<string>('');
  const [perifericoDetailModal, setPerifericoDetailModal] = useState(false);
  const [selectedPerifericoDetail, setSelectedPerifericoDetail] = useState<CrucePeriferico | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form data para nuevo periférico
  const [newPeriferico, setNewPeriferico] = useState({
    tipoPeriferico: '',
    fabricante: '',
    modelo: '',
    numeroSerie: '',
    ip: '',
    usuario: '',
    password: '',
    enGarantia: false,
    estado: 'ACTIVO',
    observaciones: ''
  });

  useEffect(() => {
    if (id === undefined) return;
    loadCruce();
    loadPerifericos();
    loadAvailablePerifericos();
    loadTipos();
  }, [id]);

  const loadCruce = async () => {
    try {
      if (id === undefined) return;
      const data = await crucesService.getCruce(id);
      setCruce(data);
    } catch (error) {
      console.error('Error loading cruce:', error);
      alert('Error al cargar el cruce');
    } finally {
      setLoading(false);
    }
  };

  const loadPerifericos = async () => {
    try {
      if (id === undefined) return;
      const data = await crucesService.getPerifericos(id);
      setPerifericos(data);
    } catch (error) {
      console.error('Error loading perifericos:', error);
    }
  };

  const loadAvailablePerifericos = async () => {
    try {
      const response = await perifericosService.getPerifericos({ limit: 100 });
      setAvailablePerifericos(response.data);
    } catch (error) {
      console.error('Error loading available perifericos:', error);
    }
  };

  const loadTipos = async () => {
    try {
      const data = await tiposService.getTipos();
      setTipos(data);
    } catch (error) {
      console.error('Error loading tipos:', error);
    }
  };

  const getTipoNombre = (id: number | undefined | null) => {
    if (!id) return 'N/A';
    const tipo = tipos.find(t => t.id === id);
    return tipo?.name || 'N/A';
  };

  const handleOpenPlano = (planoPath: string, isPdf: boolean) => {
    if (isPdf) {
      // Para PDFs, abrir en modal
      setSelectedPlano(`http://192.168.18.230:3001${planoPath}`);
      setPlanoModalOpen(true);
    } else {
      // Para DWG, descargar directamente
      const link = document.createElement('a');
      link.href = `http://192.168.18.230:3001${planoPath}`;
      link.download = planoPath.split('/').pop() || 'plano.dwg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleAddPeriferico = async () => {
    if (!newPeriferico.tipoPeriferico || id === undefined) return;
    
    try {
      // 1. Crear el periférico
      const perifericoData: any = {
        tipoPeriferico: parseInt(newPeriferico.tipoPeriferico),
        fabricante: newPeriferico.fabricante || undefined,
        modelo: newPeriferico.modelo || undefined,
        numeroSerie: newPeriferico.numeroSerie || undefined,
        usuario: newPeriferico.usuario || undefined,
        password: newPeriferico.password || undefined,
        enGarantia: newPeriferico.enGarantia,
        estado: newPeriferico.estado || 'ACTIVO',
        observaciones: newPeriferico.observaciones || undefined
      };
      
      // No enviar IP por ahora ya que es un tipo no soportado (cidr)
      // if (newPeriferico.ip) {
      //   perifericoData.ip = newPeriferico.ip;
      // }
      
      const createdPeriferico = await perifericosService.createPeriferico(perifericoData);
      
      // 2. Asociar el periférico al cruce
      await crucesService.addPeriferico(id, createdPeriferico.id);
      
      // 3. Recargar periféricos y cerrar modal
      await loadPerifericos();
      setShowAddModal(false);
      
      // 4. Limpiar formulario
      setNewPeriferico({
        tipoPeriferico: '',
        fabricante: '',
        modelo: '',
        numeroSerie: '',
        ip: '',
        usuario: '',
        password: '',
        enGarantia: false,
        estado: 'ACTIVO',
        observaciones: ''
      });
      
      alert('Periférico agregado exitosamente');
    } catch (error: any) {
      console.error('Error completo al agregar periférico:', error);
      console.error('Detalle del error:', error.response?.data || error.message);
      alert(`Error al agregar el periférico: ${error.response?.data?.message || error.message || 'Error desconocido'}`);
    }
  };

  const handleRemovePeriferico = async (perifericoId: number) => {
    if (id === undefined) return;
    if (!confirm('¿Está seguro de eliminar este periférico?')) return;
    try {
      await crucesService.removePeriferico(id, perifericoId);
      await loadPerifericos();
      alert('Periférico eliminado exitosamente');
    } catch (error) {
      console.error('Error removing periferico:', error);
      alert('Error al eliminar el periférico');
    }
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

  if (!cruce) {
    return (
      <div className="alert alert-danger">Cruce no encontrado</div>
    );
  }

  return (
    <div className="px-2 py-3">
      <div className="row g-4">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header bg-white border-bottom-0 pb-0">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">
                  <i className="fas fa-traffic-light me-2"></i>
                  Detalle del Cruce
                </h5>
                <div className="d-flex gap-2">
                  {cruce.planoPdf && (
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleOpenPlano(cruce.planoPdf!, true)}
                      title="Visualizar PDF"
                    >
                      <i className="fas fa-file-pdf"></i>
                    </button>
                  )}
                  {cruce.planoDwg && (
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleOpenPlano(cruce.planoDwg!, false)}
                      title="Descargar DWG"
                    >
                      <i className="fas fa-file"></i>
                    </button>
                  )}
                </div>
              </div>
              {cruce.nombre && (
                <p className="text-muted mb-2 mt-2">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  {cruce.nombre}
                </p>
              )}
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span><strong>Código:</strong></span>
                  <span>{cruce.codigo || 'N/A'}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span><strong>Administrador por:</strong></span>
                  <span>{cruce.administrador?.nombre || 'N/A'}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span><strong>Distrito:</strong></span>
                  <span>{cruce.ubigeo?.distrito || cruce.ubigeoId || 'N/A'}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span><strong>Tipo de gestión:</strong></span>
                  <span>{getTipoNombre(cruce.tipoGestion)}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span><strong>Tipo de comunicación:</strong></span>
                  <span>{getTipoNombre(cruce.tipoComunicacion)}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span><strong>Empresa Eléctrica:</strong></span>
                  <span>{cruce.electricoEmpresa || 'N/A'}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span><strong>N° de Suministro:</strong></span>
                  <span>{cruce.electricoSuministro || 'N/A'}</span>
                </li>
                {/* Mapa de ubicación del cruce */}
                {(cruce.latitud && cruce.longitud) && (
                  <li className="list-group-item">
                    <strong>Ubicación:</strong>
                    <div style={{ height: '220px', width: '100%', marginTop: 8, borderRadius: 8, overflow: 'hidden' }}>
                      <MapContainer
                        center={[cruce.latitud, cruce.longitud]}
                        zoom={17}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={false}
                        dragging={false}
                        doubleClickZoom={false}
                        zoomControl={false}
                        attributionControl={false}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution="&copy; OpenStreetMap contributors"
                        />
                        <Marker position={[cruce.latitud, cruce.longitud]}>
                          <Popup>
                            {cruce.nombre}
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  </li>
                )}
                {cruce.observaciones && (
                  <li className="list-group-item">
                    <strong>Observaciones:</strong>
                    <div className="mt-1">{cruce.observaciones}</div>
                  </li>
                )}
              </ul>
              <div className="d-flex justify-content-end p-3 pt-2">
                <button className="btn btn-outline-danger" onClick={handleExportPDF}>
                  <i className="fas fa-file-pdf me-2"></i> Exportar ficha PDF
                </button>
              </div>
            </div>
            <div className="card-footer bg-white border-top-0 pt-3 d-flex gap-2">
              <button className="btn btn-outline-primary" onClick={() => {
                if (cruceId && onClose) {
                  onClose();
                }
                navigate(`/cruces/${id}/edit`);
              }}>
                <i className="fas fa-edit me-1"></i> Editar
              </button>
              <button className="btn btn-outline-secondary" onClick={() => {
                if (cruceId && onClose) {
                  onClose();
                } else {
                  navigate('/cruces');
                }
              }}>
                <i className="fas fa-arrow-left me-2"></i> Volver
              </button>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white border-bottom-0 pb-0 d-flex align-items-center justify-content-between">
              <span className="fw-bold">
                <i className="fas fa-microchip me-2"></i>
                Periféricos ({perifericos.length})
              </span>
              <button className="btn btn-sm btn-outline-primary" onClick={() => setShowAddModal(true)}>
                <i className="fas fa-plus"></i>
              </button>
            </div>
            <div className="card-body p-0">
              {perifericos.length === 0 ? (
                <div className="text-muted text-center py-4">No hay periféricos instalados</div>
              ) : (
                <ul className="list-group list-group-flush">
                  {perifericos.map((cp) => (
                    <li key={cp.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="flex-grow-1">
                          <h6 className="mb-0">
                            <i className="fas fa-microchip me-2 text-primary"></i>
                            {getTipoNombre(cp.periferico?.tipoPeriferico)}
                          </h6>
                        </div>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => {
                              setSelectedPerifericoDetail(cp);
                              setPerifericoDetailModal(true);
                            }}
                            title="Ver detalle"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemovePeriferico(cp.perifericoId)}
                            title="Eliminar"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Agregar Periférico */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="fas fa-microchip me-2"></i>
                  Agregar Nuevo Periférico
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      Tipo de Periférico <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={newPeriferico.tipoPeriferico}
                      onChange={(e) => setNewPeriferico({...newPeriferico, tipoPeriferico: e.target.value})}
                      required
                    >
                      <option value="">Seleccione un tipo...</option>
                      {tipos.filter(t => t.parent_id === 3).map(tipo => (
                        <option key={tipo.id} value={tipo.id}>{tipo.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold">Estado</label>
                    <select
                      className="form-select"
                      value={newPeriferico.estado}
                      onChange={(e) => setNewPeriferico({...newPeriferico, estado: e.target.value})}
                    >
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                      <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                      <option value="AVERIADO">AVERIADO</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold">Fabricante</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newPeriferico.fabricante}
                      onChange={(e) => setNewPeriferico({...newPeriferico, fabricante: e.target.value})}
                      placeholder="Ej: Siemens, Swarco..."
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold">Modelo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newPeriferico.modelo}
                      onChange={(e) => setNewPeriferico({...newPeriferico, modelo: e.target.value})}
                      placeholder="Ej: MC-7000, XYZ-100..."
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold">Número de Serie</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newPeriferico.numeroSerie}
                      onChange={(e) => setNewPeriferico({...newPeriferico, numeroSerie: e.target.value})}
                      placeholder="Número de serie del dispositivo"
                    />
                  </div>

                  {/* Campo IP comentado temporalmente - requiere tipo CIDR en DB
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Dirección IP</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newPeriferico.ip}
                      onChange={(e) => setNewPeriferico({...newPeriferico, ip: e.target.value})}
                      placeholder="Ej: 192.168.1.100"
                    />
                  </div>
                  */}

                  <div className="col-md-6">
                    <label className="form-label fw-bold">Usuario</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newPeriferico.usuario}
                      onChange={(e) => setNewPeriferico({...newPeriferico, usuario: e.target.value})}
                      placeholder="Usuario de acceso"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold">Contraseña</label>
                    <input
                      type="password"
                      className="form-control"
                      value={newPeriferico.password}
                      onChange={(e) => setNewPeriferico({...newPeriferico, password: e.target.value})}
                      placeholder="Contraseña de acceso"
                    />
                  </div>

                  <div className="col-12">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="enGarantia"
                        checked={newPeriferico.enGarantia}
                        onChange={(e) => setNewPeriferico({...newPeriferico, enGarantia: e.target.checked})}
                      />
                      <label className="form-check-label" htmlFor="enGarantia">
                        En garantía
                      </label>
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-bold">Observaciones</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={newPeriferico.observaciones}
                      onChange={(e) => setNewPeriferico({...newPeriferico, observaciones: e.target.value})}
                      placeholder="Observaciones adicionales..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAddModal(false)}>
                  <i className="fas fa-times me-2"></i>
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleAddPeriferico}
                  disabled={!newPeriferico.tipoPeriferico}
                >
                  <i className="fas fa-plus me-2"></i>
                  Agregar Periférico
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizar PDF */}
      {planoModalOpen && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="fas fa-file-pdf me-2"></i>
                  Visualización de Plano PDF
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setPlanoModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body p-0" style={{ height: '80vh' }}>
                <iframe 
                  src={selectedPlano} 
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="Plano PDF"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle Periférico */}
      {perifericoDetailModal && selectedPerifericoDetail && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="fas fa-microchip me-2"></i>
                  Detalle del Periférico
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => {
                    setPerifericoDetailModal(false);
                    setSelectedPerifericoDetail(null);
                    setShowPassword(false);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <div className="card bg-light border-0">
                      <div className="card-body py-2">
                        <strong className="text-primary">
                          <i className="fas fa-tag me-2"></i>
                          Tipo: {getTipoNombre(selectedPerifericoDetail.periferico?.tipoPeriferico)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted mb-1" style={{ fontSize: '12px' }}>Fabricante</label>
                    <p className="mb-0">{selectedPerifericoDetail.periferico?.fabricante || 'N/A'}</p>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted mb-1" style={{ fontSize: '12px' }}>Modelo</label>
                    <p className="mb-0">{selectedPerifericoDetail.periferico?.modelo || 'N/A'}</p>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted mb-1" style={{ fontSize: '12px' }}>Número de Serie</label>
                    <p className="mb-0">{selectedPerifericoDetail.periferico?.numeroSerie || 'N/A'}</p>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted mb-1" style={{ fontSize: '12px' }}>Estado</label>
                    <p className="mb-0">
                      <span className={`badge ${
                        selectedPerifericoDetail.periferico?.estado === 'ACTIVO' ? 'bg-success' :
                        selectedPerifericoDetail.periferico?.estado === 'INACTIVO' ? 'bg-secondary' :
                        selectedPerifericoDetail.periferico?.estado === 'MANTENIMIENTO' ? 'bg-warning text-dark' :
                        selectedPerifericoDetail.periferico?.estado === 'AVERIADO' ? 'bg-danger' : 'bg-secondary'
                      }`}>
                        {selectedPerifericoDetail.periferico?.estado || 'N/A'}
                      </span>
                    </p>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted mb-1" style={{ fontSize: '12px' }}>Dirección IP</label>
                    <p className="mb-0">
                      {selectedPerifericoDetail.periferico?.ip ? (
                        <code className="bg-light px-2 py-1 rounded">{String(selectedPerifericoDetail.periferico.ip)}</code>
                      ) : (
                        'N/A'
                      )}
                    </p>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted mb-1" style={{ fontSize: '12px' }}>Usuario</label>
                    <p className="mb-0">{selectedPerifericoDetail.periferico?.usuario || 'N/A'}</p>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted mb-1" style={{ fontSize: '12px' }}>Contraseña</label>
                    <div className="d-flex align-items-center gap-2">
                      <p className="mb-0">
                        {selectedPerifericoDetail.periferico?.password ? (
                          <code className="bg-light px-2 py-1 rounded">
                            {showPassword ? selectedPerifericoDetail.periferico.password : '••••••••'}
                          </code>
                        ) : (
                          'N/A'
                        )}
                      </p>
                      {selectedPerifericoDetail.periferico?.password && (
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                          title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                          <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted mb-1" style={{ fontSize: '12px' }}>En Garantía</label>
                    <p className="mb-0">
                      {selectedPerifericoDetail.periferico?.enGarantia ? (
                        <span className="badge bg-success">
                          <i className="fas fa-check me-1"></i>Sí
                        </span>
                      ) : (
                        <span className="badge bg-secondary">
                          <i className="fas fa-times me-1"></i>No
                        </span>
                      )}
                    </p>
                  </div>

                  {selectedPerifericoDetail.periferico?.observaciones && (
                    <div className="col-12">
                      <label className="form-label fw-bold text-muted mb-1" style={{ fontSize: '12px' }}>Observaciones</label>
                      <div className="p-2 bg-light rounded">
                        <p className="mb-0">{selectedPerifericoDetail.periferico.observaciones}</p>
                      </div>
                    </div>
                  )}

                  {selectedPerifericoDetail.periferico?.usuario_registra && (
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted mb-1" style={{ fontSize: '12px' }}>Registrado por</label>
                      <p className="mb-0">{selectedPerifericoDetail.periferico.usuario_registra}</p>
                    </div>
                  )}

                  {(selectedPerifericoDetail.periferico?.createdAt || selectedPerifericoDetail.periferico?.updatedAt) && (
                    <>
                      {selectedPerifericoDetail.periferico?.createdAt && (
                        <div className="col-md-6">
                          <label className="form-label fw-bold text-muted mb-1" style={{ fontSize: '12px' }}>Fecha de Creación</label>
                          <p className="mb-0">
                            <i className="far fa-calendar-alt me-2 text-muted"></i>
                            {new Date(selectedPerifericoDetail.periferico.createdAt).toLocaleString('es-PE')}
                          </p>
                        </div>
                      )}
                      {selectedPerifericoDetail.periferico?.updatedAt && (
                        <div className="col-md-6">
                          <label className="form-label fw-bold text-muted mb-1" style={{ fontSize: '12px' }}>Última Modificación</label>
                          <p className="mb-0">
                            <i className="far fa-calendar-alt me-2 text-muted"></i>
                            {new Date(selectedPerifericoDetail.periferico.updatedAt).toLocaleString('es-PE')}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setPerifericoDetailModal(false);
                    setSelectedPerifericoDetail(null);
                    setShowPassword(false);
                  }}
                >
                  <i className="fas fa-times me-2"></i>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
