import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { crucesService, perifericosService, Cruce, Periferico, CrucePeriferico } from '../../services/cruces.service';

export function CruceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [cruce, setCruce] = useState<Cruce | null>(null);
  const [loading, setLoading] = useState(true);
  const [perifericos, setPerifericos] = useState<CrucePeriferico[]>([]);
  const [availablePerifericos, setAvailablePerifericos] = useState<Periferico[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPeriferico, setSelectedPeriferico] = useState<number | null>(null);

  useEffect(() => {
    loadCruce();
    loadPerifericos();
    loadAvailablePerifericos();
  }, [id]);

  const loadCruce = async () => {
    try {
      const data = await crucesService.getCruce(parseInt(id!));
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
      const data = await crucesService.getPerifericos(parseInt(id!));
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

  const handleAddPeriferico = async () => {
    if (!selectedPeriferico) return;

    try {
      await crucesService.addPeriferico(parseInt(id!), selectedPeriferico);
      alert('Periférico agregado exitosamente');
      setShowAddModal(false);
      setSelectedPeriferico(null);
      loadPerifericos();
    } catch (error: any) {
      console.error('Error adding periferico:', error);
      alert(error.response?.data?.message || 'Error al agregar periférico');
    }
  };

  const handleRemovePeriferico = async (perifericoId: number) => {
    if (!confirm('¿Está seguro de remover este periférico del cruce?')) return;

    try {
      await crucesService.removePeriferico(parseInt(id!), perifericoId);
      alert('Periférico removido exitosamente');
      loadPerifericos();
    } catch (error) {
      console.error('Error removing periferico:', error);
      alert('Error al remover periférico');
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
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-lg-8">
          {/* Información del Cruce */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <i className="fas fa-traffic-light me-2"></i>
                Detalle del Cruce
              </h4>
              <button 
                className="btn btn-light btn-sm"
                onClick={() => navigate(`/cruces/${id}/edit`)}
              >
                <i className="fas fa-edit me-1"></i>
                Editar
              </button>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <strong>Código:</strong>
                  <p>{cruce.codigo || 'N/A'}</p>
                </div>
                <div className="col-md-6">
                  <strong>Estado:</strong>
                  <p>
                    <span className={`badge ${cruce.estado ? 'bg-success' : 'bg-danger'}`}>
                      {cruce.estado ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </p>
                </div>
                <div className="col-12">
                  <strong>Nombre:</strong>
                  <p>{cruce.nombre}</p>
                </div>
                <div className="col-md-6">
                  <strong>Latitud:</strong>
                  <p>{cruce.latitud?.toFixed(6)}</p>
                </div>
                <div className="col-md-6">
                  <strong>Longitud:</strong>
                  <p>{cruce.longitud?.toFixed(6)}</p>
                </div>
                {cruce.anoImplementacion && (
                  <div className="col-md-6">
                    <strong>Año de Implementación:</strong>
                    <p>{cruce.anoImplementacion}</p>
                  </div>
                )}
                {cruce.tipoOperacion && (
                  <div className="col-md-6">
                    <strong>Tipo de Operación:</strong>
                    <p>{cruce.tipoOperacion}</p>
                  </div>
                )}
                {cruce.electricoEmpresa && (
                  <div className="col-md-6">
                    <strong>Empresa Eléctrica:</strong>
                    <p>{cruce.electricoEmpresa}</p>
                  </div>
                )}
                {cruce.electricoSuministro && (
                  <div className="col-md-6">
                    <strong>Suministro Eléctrico:</strong>
                    <p>{cruce.electricoSuministro}</p>
                  </div>
                )}
                {cruce.observaciones && (
                  <div className="col-12">
                    <strong>Observaciones:</strong>
                    <p>{cruce.observaciones}</p>
                  </div>
                )}
              </div>

              <div className="mt-3">
                <a
                  href={`https://www.google.com/maps?q=${cruce.latitud},${cruce.longitud}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-primary"
                >
                  <i className="fas fa-map-marker-alt me-2"></i>
                  Ver en Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          {/* Periféricos */}
          <div className="card">
            <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-microchip me-2"></i>
                Periféricos ({perifericos.length})
              </h5>
              <button 
                className="btn btn-light btn-sm"
                onClick={() => setShowAddModal(true)}
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
            <div className="card-body">
              {perifericos.length === 0 ? (
                <p className="text-muted text-center">No hay periféricos instalados</p>
              ) : (
                <div className="list-group">
                  {perifericos.map((cp) => (
                    <div key={cp.id} className="list-group-item d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1">{cp.periferico?.fabricante} {cp.periferico?.modelo}</h6>
                        <small className="text-muted">
                          Serie: {cp.periferico?.numeroSerie || 'N/A'}
                        </small>
                        <br />
                        <span className="badge bg-secondary mt-1">
                          {cp.periferico?.estado || 'N/A'}
                        </span>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleRemovePeriferico(cp.perifericoId)}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Agregar Periférico */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Agregar Periférico</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body">
                <label className="form-label">Seleccionar Periférico</label>
                <select
                  className="form-select"
                  value={selectedPeriferico || ''}
                  onChange={(e) => setSelectedPeriferico(parseInt(e.target.value))}
                >
                  <option value="">Seleccione...</option>
                  {availablePerifericos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fabricante} {p.modelo} - {p.numeroSerie}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleAddPeriferico}
                  disabled={!selectedPeriferico}
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button 
        className="btn btn-secondary mt-3"
        onClick={() => navigate('/cruces')}
      >
        <i className="fas fa-arrow-left me-2"></i>
        Volver
      </button>
    </div>
  );
}
