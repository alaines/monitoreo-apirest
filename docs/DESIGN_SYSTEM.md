# SISTEMA DE DISEÑO Y COMPONENTES ENTERPRISE
## Guía Oficial de Componentes y Snippets de Referencia

Este catálogo contiene los snippets canónicos de interfaz que deben utilizarse de manera uniforme en todas las vistas y módulos del sistema.

---

### Snippet 1: Banner de Cabecera de Página (`.app-page-title`)

Debe colocarse como primer elemento dentro de cada vista o pantalla del dashboard.

#### Versión HTML / Bootstrap:
```html
<div class="app-page-title mb-3">
  <div class="page-title-wrapper d-flex justify-content-between align-items-center">
    <!-- Identificador del módulo -->
    <div class="page-title-heading d-flex align-items-center">
      <div class="page-title-icon me-3">
        <i class="fas fa-traffic-light text-primary"></i>
      </div>
      <div>
        <h4 class="page-title-title mb-0 fw-bold text-dark">Monitoreo de Cruces Semafóricos</h4>
        <div class="page-title-subheading text-muted small">
          Control en tiempo real del estado de operación, periféricos y telemetría de red.
        </div>
      </div>
    </div>
    
    <!-- Acciones globales de la página -->
    <div class="page-title-actions d-flex gap-2">
      <button type="button" class="btn btn-sm btn-outline-secondary">
        <i class="fas fa-filter me-1"></i> Filtros Avanzados
      </button>
      <button type="button" class="btn btn-sm btn-outline-primary">
        <i class="fas fa-file-export me-1"></i> Exportar
      </button>
      <button type="button" class="btn btn-sm btn-primary">
        <i class="fas fa-plus me-1"></i> Nuevo Cruce
      </button>
    </div>
  </div>
</div>
```

#### Versión React / JSX (TSX):
```tsx
export function PageHeader() {
  return (
    <div className="app-page-title mb-3">
      <div className="page-title-wrapper d-flex justify-content-between align-items-center">
        <div className="page-title-heading d-flex align-items-center">
          <div className="page-title-icon me-3">
            <i className="fas fa-traffic-light text-primary"></i>
          </div>
          <div>
            <h4 className="page-title-title mb-0 fw-bold text-dark">Monitoreo de Cruces Semafóricos</h4>
            <div className="page-title-subheading text-muted small">
              Control en tiempo real del estado de operación, periféricos y telemetría de red.
            </div>
          </div>
        </div>
        <div className="page-title-actions d-flex gap-2">
          <button type="button" className="btn btn-sm btn-outline-secondary">
            <i className="fas fa-filter me-1"></i> Filtros
          </button>
          <button type="button" className="btn btn-sm btn-primary">
            <i className="fas fa-plus me-1"></i> Nuevo Cruce
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### Snippet 2: Tarjeta Métrica de Telemetría / KPI con Barra de Progreso (`.card-widget`)

Diseñada para cuadrículas de métricas (`row row-cols-1 row-cols-md-2 row-cols-xl-4 g-3`).

#### Versión HTML / Bootstrap:
```html
<div class="col">
  <div class="card card-widget mb-3 h-100 border shadow-sm">
    <div class="card-body p-3">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="widget-subheading text-uppercase text-muted fw-bold small">
          Cruces Operativos
        </div>
        <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
          <i class="fas fa-arrow-up me-1"></i> +2.4%
        </span>
      </div>
      
      <div class="d-flex justify-content-between align-items-baseline mb-2">
        <div class="widget-numbers fw-bold text-dark" style="font-size: 28px; line-height: 1.1;">
          1,428 <small class="text-muted fw-normal" style="font-size: 14px;">/ 1,480</small>
        </div>
        <div class="widget-icon-box text-primary">
          <i class="fas fa-network-wired fa-lg opacity-75"></i>
        </div>
      </div>
      
      <!-- Barra de progreso técnica -->
      <div class="progress progress-sm" style="height: 5px;">
        <div class="progress-bar bg-success" role="progressbar" style="width: 96.4%;" aria-valuenow="96.4" aria-valuemin="0" aria-valuemax="100"></div>
      </div>
      
      <div class="d-flex justify-content-between align-items-center mt-2 pt-1 border-top border-light">
        <span class="text-muted" style="font-size: 11px;">Disponibilidad global</span>
        <span class="fw-bold text-dark" style="font-size: 11px;">96.4%</span>
      </div>
    </div>
  </div>
</div>
```

---

### Snippet 3: Tabla Técnica con Badges de Estado y Acciones de Fila

Estructura para listados de datos, inventario, incidencias y cruces.

#### Versión HTML / Bootstrap:
```html
<div class="card mb-3 border shadow-sm">
  <div class="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
    <div class="d-flex align-items-center">
      <i class="fas fa-list-alt text-primary me-2"></i>
      <span class="fw-bold text-dark" style="font-size: 14px;">Registro de Incidencias Técnicas</span>
    </div>
    <div class="btn-actions-pane-right d-flex gap-2">
      <button class="btn btn-sm btn-outline-secondary py-1 px-2" title="Refrescar datos">
        <i class="fas fa-sync-alt"></i>
      </button>
    </div>
  </div>
  
  <div class="table-responsive">
    <table class="table table-hover table-striped align-middle mb-0" style="font-size: 13px;">
      <thead class="table-light text-uppercase" style="font-size: 12px; letter-spacing: 0.5px;">
        <tr>
          <th scope="col" style="width: 90px;" class="ps-3">ID Ticket</th>
          <th scope="col">Intersección / Cruce</th>
          <th scope="col">Tipo de Incidencia</th>
          <th scope="col" style="width: 140px;">Estado</th>
          <th scope="col" style="width: 130px;">Prioridad</th>
          <th scope="col" style="width: 160px;">Fecha Registro</th>
          <th scope="col" style="width: 110px;" class="text-end pe-3">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <!-- Fila Crítica / Apagado -->
        <tr>
          <td class="ps-3 fw-bold text-dark">#62433</td>
          <td>
            <div class="fw-bold text-dark">AV. AVIACION - CA. TRES AVENIDAS</div>
            <div class="text-muted small">Cruce #843 &bull; Cabecera Central</div>
          </td>
          <td>
            <span class="badge bg-danger">
              <i class="fas fa-exclamation-triangle me-1"></i> CRUCE APAGADO
            </span>
          </td>
          <td><span class="badge bg-danger">PENDIENTE</span></td>
          <td><span class="badge bg-dark">ALTA</span></td>
          <td class="text-muted">19/09/2026 15:50</td>
          <td class="text-end pe-3">
            <div class="btn-group btn-group-sm" role="group">
              <button class="btn btn-outline-primary" title="Ver detalle">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-outline-secondary" title="Editar">
                <i class="fas fa-edit"></i>
              </button>
            </div>
          </td>
        </tr>
        
        <!-- Fila Advertencia / Intermitente -->
        <tr>
          <td class="ps-3 fw-bold text-dark">#62432</td>
          <td>
            <div class="fw-bold text-dark">AV. LA MARINA - AV. DE LA RIVA AGUERO</div>
            <div class="text-muted small">Cruce #478 &bull; Zona Oeste</div>
          </td>
          <td>
            <span class="badge bg-warning text-dark">
              <i class="fas fa-traffic-light me-1"></i> SEMÁFORO INTERMITENTE
            </span>
          </td>
          <td><span class="badge bg-warning text-dark">EN PROCESO</span></td>
          <td><span class="badge bg-secondary">MEDIA</span></td>
          <td class="text-muted">19/09/2026 14:01</td>
          <td class="text-end pe-3">
            <div class="btn-group btn-group-sm" role="group">
              <button class="btn btn-outline-primary" title="Ver detalle">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-outline-secondary" title="Editar">
                <i class="fas fa-edit"></i>
              </button>
            </div>
          </td>
        </tr>
        
        <!-- Fila Operativa / Resuelta -->
        <tr>
          <td class="ps-3 fw-bold text-dark">#62410</td>
          <td>
            <div class="fw-bold text-dark">AV. AREQUIPA - AV. JAVIER PRADO</div>
            <div class="text-muted small">Cruce #102 &bull; Corredor Central</div>
          </td>
          <td>
            <span class="badge bg-info text-dark">
              <i class="fas fa-wrench me-1"></i> MANTENIMIENTO PREVENTIVO
            </span>
          </td>
          <td><span class="badge bg-success">RESUELTO</span></td>
          <td><span class="badge bg-light text-dark border">BAJA</span></td>
          <td class="text-muted">19/09/2026 10:15</td>
          <td class="text-end pe-3">
            <div class="btn-group btn-group-sm" role="group">
              <button class="btn btn-outline-primary" title="Ver detalle">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-outline-secondary" title="Editar">
                <i class="fas fa-edit"></i>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <div class="card-footer bg-white border-top py-2 px-3 d-flex justify-content-between align-items-center">
    <small class="text-muted">Mostrando 1-3 de 150 registros</small>
    <ul class="pagination pagination-sm mb-0">
      <li class="page-item disabled"><a class="page-link" href="#">&laquo;</a></li>
      <li class="page-item active"><a class="page-link" href="#">1</a></li>
      <li class="page-item"><a class="page-link" href="#">2</a></li>
      <li class="page-item"><a class="page-link" href="#">3</a></li>
      <li class="page-item"><a class="page-link" href="#">&raquo;</a></li>
    </ul>
  </div>
</div>
```

---

### Snippet 4: Formulario Técnico en Rejilla con Validación

Estructura modular para captura de datos, configuración de cruces y formularios de gestión.

#### Versión HTML / Bootstrap:
```html
<div class="card mb-3 border shadow-sm">
  <div class="card-header bg-white border-bottom py-2 d-flex align-items-center">
    <i class="fas fa-sliders-h text-primary me-2"></i>
    <span class="fw-bold text-dark" style="font-size: 14px;">Configuración Técnica de Intersección</span>
  </div>
  
  <div class="card-body p-4">
    <form class="row g-3">
      <!-- Fila 1: Código y Nombre -->
      <div class="col-md-4">
        <label for="cruceCodigo" class="form-label fw-bold small text-dark">
          Código del Cruce <span class="text-danger">*</span>
        </label>
        <div class="input-group input-group-sm">
          <span class="input-group-text bg-light text-muted"><i class="fas fa-hashtag"></i></span>
          <input type="text" class="form-control form-control-sm" id="cruceCodigo" placeholder="Ej. CR-0843" required>
        </div>
        <div class="form-text" style="font-size: 11px;">Identificador único en inventario.</div>
      </div>
      
      <div class="col-md-8">
        <label for="cruceNombre" class="form-label fw-bold small text-dark">
          Nombre de la Intersección <span class="text-danger">*</span>
        </label>
        <div class="input-group input-group-sm">
          <span class="input-group-text bg-light text-muted"><i class="fas fa-map-marker-alt"></i></span>
          <input type="text" class="form-control form-control-sm" id="cruceNombre" placeholder="AV. PRINCIPAL - CA. SECUNDARIA" required>
        </div>
      </div>

      <!-- Fila 2: Tipo de Gestión, Proyecto y Administrador -->
      <div class="col-md-4">
        <label for="tipoGestion" class="form-label fw-bold small text-dark">Tipo de Gestión</label>
        <select class="form-select form-select-sm" id="tipoGestion">
          <option value="1">Centralizado (Online)</option>
          <option value="2">Aislado / Autónomo</option>
          <option value="3">Coordinado por Cable</option>
        </select>
      </div>

      <div class="col-md-4">
        <label for="proyectoId" class="form-label fw-bold small text-dark">Proyecto Asignado</label>
        <select class="form-select form-select-sm" id="proyectoId">
          <option value="1">Red Semafórica Central</option>
          <option value="2">Ampliación Corredor Sur</option>
        </select>
      </div>

      <div class="col-md-4">
        <label for="administradorId" class="form-label fw-bold small text-dark">Contratista / Administrador</label>
        <select class="form-select form-select-sm" id="administradorId">
          <option value="1">MUNICIPALIDAD METROPOLITANA</option>
          <option value="2">CONSORCIO VIAL LIMA</option>
        </select>
      </div>

      <!-- Fila 3: Coordenadas Geográficas -->
      <div class="col-md-6">
        <label for="latitud" class="form-label fw-bold small text-dark">Latitud (WGS84)</label>
        <input type="number" step="0.000001" class="form-control form-control-sm" id="latitud" placeholder="-12.046374">
      </div>

      <div class="col-md-6">
        <label for="longitud" class="form-label fw-bold small text-dark">Longitud (WGS84)</label>
        <input type="number" step="0.000001" class="form-control form-control-sm" id="longitud" placeholder="-77.042793">
      </div>

      <!-- Fila 4: Observaciones Técnicas -->
      <div class="col-12">
        <label for="observaciones" class="form-label fw-bold small text-dark">Observaciones Técnicas</label>
        <textarea class="form-control form-control-sm" id="observaciones" rows="3" placeholder="Detalles de suministro eléctrico, controladores, módulos periféricos..."></textarea>
      </div>

      <!-- Barra de Botones de Acción del Formulario -->
      <div class="col-12 d-flex justify-content-end gap-2 pt-3 border-top mt-4">
        <button type="button" class="btn btn-sm btn-light border px-3">
          <i class="fas fa-times me-1"></i> Cancelar
        </button>
        <button type="submit" class="btn btn-sm btn-primary px-3">
          <i class="fas fa-save me-1"></i> Guardar Cambios
        </button>
      </div>
    </form>
  </div>
</div>
```
