# REGLAS DE ARQUITECTURA Y DISEÑO FRONTEND ENTERPRISE
## Sistema de Monitoreo y Gestión de Tráfico (ArchitectUI / AdminLTE Pattern)

Este documento establece las normas mandatorias de diseño, estructura visual y estándares de código frontend para el proyecto. Todo nuevo desarrollo, refactorización o corrección debe adherirse estrictamente a estas reglas.

---

## 1. Stack Visual Mandatorio

1. **Framework CSS**: **Bootstrap 5.x** como base estructural exclusiva (Grid `row`/`col`, Utilidades de espaciado `p-*`, `m-*`, `d-flex`, `align-items-*`, `justify-content-*`, Componentes `card`, `table`, `btn`, `badge`, `modal`, `nav`).
2. **Iconografía**: **FontAwesome 6** (`fa-solid`, `fa-regular`, `fas`, `far`, etc.). No se permite ninguna otra librería de iconos ni el uso de emojis Unicode nativos en la interfaz.
3. **Tipografía & Paleta**: Tipografía sans-serif corporativa limpia (Inter / Roboto / Segoe UI / Bootstrap default) con la paleta empresarial basada en variables CSS (`theme.css` y `dashboard-enterprise.css`).

---

## 2. Restricciones Anti-IA (Directrices Estrictas)

Para evitar la degradación estética hacia interfaces genéricas no corporativas:

* 🚫 **PROHIBIDO el uso de Tailwind CSS** o utilidades arbitrarias que colisionen con Bootstrap 5.
* 🚫 **PROHIBIDO el uso de degradados violetas, púrpuras, índigos genéricos o efectos "glassmorphism"**.
* 🚫 **PROHIBIDO el uso de bordes ultra redondeados** (`rounded-3xl`, `rounded-pill` en tarjetas, etc.). El radio de borde máximo para contenedores, tarjetas y modales es de **`0.375rem` (6px)**.
* 🚫 **PROHIBIDO componentes flotantes sin bordes definidos**. Todo card, panel, modal y dropdown debe contar con un borde estructural formal (`1px solid rgba(0,0,0,0.085)` o `var(--gray-300)`) y sombra sobria (`var(--shadow-sm)` o `var(--shadow)`).
* 🚫 **PROHIBIDO el uso de emojis** (e.g. 🚨, 🔔, 📊, 🚗) en títulos, tablas, botones o indicadores de estado. La señalización debe ser 100% mediante iconos FontAwesome con clases semánticas.

---

## 3. Jerarquía Visual Estándar

### A. Cabecera de Página Obligatoria (`.app-page-title`)
Toda vista o pantalla debe iniciar con el banner formal de página:
```html
<div class="app-page-title">
  <div class="page-title-wrapper">
    <div class="page-title-heading">
      <div class="page-title-icon">
        <i class="fas fa-traffic-light"></i>
      </div>
      <div>
        <h4 class="page-title-title">Título del Módulo</h4>
        <div class="page-title-subheading">Descripción técnica concisa del objetivo de la vista.</div>
      </div>
    </div>
    <div class="page-title-actions">
      <!-- Botones de acción primaria, filtros o exportación -->
      <button class="btn btn-sm btn-primary">
        <i class="fas fa-plus me-1"></i> Nuevo Registro
      </button>
    </div>
  </div>
</div>
```

### B. Estructura de Tarjetas (Cards)
Todas las secciones y paneles de contenido se organizan en tarjetas formales:
* Contenedor: `.card.mb-3`
* Cabecera: `.card-header` con icono representativo, texto en semi-bold y opcionalmente botones/filtros a la derecha (`.btn-actions-pane-right`).
* Cuerpo: `.card-body` con espaciado limpio.

### C. Widgets de Métricas y KPIs (`.card-widget`)
Para métricas, telemetría y contadores:
* Clase contenedor: `.card.card-widget.mb-3`
* Cifra destacada: `.widget-numbers` (fuente en negrita de 28px con color semántico).
* Etiqueta técnica: `.widget-subheading` (texto en mayúsculas pequeñas, 11px, `text-muted fw-bold`).
* Indicador de progreso: Barra técnica compacta `.progress.progress-sm` (4px-6px de alto).

### D. Tablas de Datos Técnicas
Para listados, consultas y reportes:
* Clases de tabla: `.table.table-hover.table-striped.align-middle.table-compact`
* Encabezado: `<thead class="table-light">` con tipografía de 12-13px y texto en mayúsculas sutiles (`text-uppercase`).
* Badges de estado: Usar exclusivamente badges estándar de Bootstrap:
  - Activo / Resuelto / Operativo: `.badge.bg-success`
  - Crítico / Apagado / Error: `.badge.bg-danger`
  - Pendiente / Intermitente / Alerta: `.badge.bg-warning.text-dark`
  - En Proceso / Asignado: `.badge.bg-primary` o `.badge.bg-info.text-dark`
  - Inactivo / Cancelado: `.badge.bg-secondary`
* Acciones de fila: Botones de tamaño pequeño `.btn.btn-sm.btn-outline-*` con iconos FontAwesome.

### E. Formularios Técnicos en Rejilla
* Grid: `.row.g-3` de Bootstrap 5.
* Etiquetas: `.form-label` en semi-bold sutil (13px, `text-dark`).
* Controles: `.form-control.form-control-sm` y `.form-select.form-select-sm`.
* Ayudas y errores: `.form-text` y `.invalid-feedback` compactos.

---

## 4. Paleta de Colores Corporativa (Design Tokens)

* **Fondo General del Sistema (`body`)**: `#f1f4f6`
* **Azul Principal Corporativo (`--primary`)**: `#1D546D`
* **Azul Oscuro de Cabecera / Sidebar (`--primary-darkest`)**: `#061E29`
* **Teal / Acento Secundario (`--secondary`)**: `#5F9598`
* **Rojo Crítico / Alerta (`--danger`)**: `#c0392b`
* **Amarillo / Advertencia (`--warning`)**: `#f39c12`
* **Verde Éxito / Operativo (`--success`)**: `#27ae60`
* **Borde Estructural**: `1px solid rgba(0, 0, 0, 0.085)`
* **Radio de Borde Máximo**: `0.375rem` (6px)

---

## 5. Protocolo Obligatorio de Compilación y Despliegue Local

En **CADA cambio** realizado en el frontend (`apps/frontend/`) o librerías asociadas:

1. **Compilar**: Ejecutar `docker exec monitoreo-frontend npm run build` para garantizar cero errores de TypeScript y empaquetado.
2. **Reiniciar**: Ejecutar `docker restart monitoreo-frontend` para asegurar que el servidor de desarrollo y el bundle queden sincronizados y activos.
