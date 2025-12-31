import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { crucesService, Cruce } from '../../services/cruces.service';

export function CruceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
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
    if (isEdit) {
      loadCruce();
    }
  }, [id]);

  const loadCruce = async () => {
    try {
      setLoading(true);
      const cruce = await crucesService.getCruce(parseInt(id!));
      setFormData(cruce);
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
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? (value === '' ? undefined : parseFloat(value)) :
              value,
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
      if (isEdit) {
        await crucesService.updateCruce(parseInt(id!), formData);
        alert('Cruce actualizado exitosamente');
      } else {
        await crucesService.createCruce(formData);
        alert('Cruce creado exitosamente');
      }
      navigate('/cruces');
    } catch (error: any) {
      console.error('Error saving cruce:', error);
      alert(error.response?.data?.message || 'Error al guardar el cruce');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                <i className="fas fa-traffic-light me-2"></i>
                {isEdit ? 'Editar Cruce' : 'Nuevo Cruce'}
              </h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {/* Información Básica */}
                  <div className="col-12">
                    <h5 className="border-bottom pb-2">Información Básica</h5>
                  </div>

                  <div className="col-md-8">
                    <label className="form-label">Nombre del Cruce <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="nombre"
                      value={formData.nombre || ''}
                      onChange={handleChange}
                      required
                      placeholder="Ej: AV. AREQUIPA CON AV. BENAVIDES"
                    />
                  </div>

                  <div className="col-md-4">
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

                  {/* Ubicación */}
                  <div className="col-12 mt-4">
                    <h5 className="border-bottom pb-2">Ubicación Geográfica</h5>
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
                      step="0.000001"
                      min="-90"
                      max="90"
                    />
                    <small className="text-muted">Rango: -90 a 90</small>
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
                      step="0.000001"
                      min="-180"
                      max="180"
                    />
                    <small className="text-muted">Rango: -180 a 180</small>
                  </div>

                  {/* Configuración */}
                  <div className="col-12 mt-4">
                    <h5 className="border-bottom pb-2">Configuración</h5>
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
                    <label className="form-label">Tipo de Operación</label>
                    <input
                      type="text"
                      className="form-control"
                      name="tipoOperacion"
                      value={formData.tipoOperacion || ''}
                      onChange={handleChange}
                    />
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

                  {/* Botones */}
                  <div className="col-12 mt-4">
                    <div className="d-flex gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Guardando...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-2"></i>
                            {isEdit ? 'Actualizar' : 'Guardar'}
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate('/cruces')}
                        disabled={loading}
                      >
                        <i className="fas fa-times me-2"></i>
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
