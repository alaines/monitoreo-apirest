# ESTADO DEL PROYECTO Y BALANCE DE SPRINTS
## Sistema de Control y Monitoreo de Intersecciones Semafóricas e Incidencias
**Versión Actual**: v1.2.0  
**Fecha de Evaluación**: Septiembre 2026  

---

## 1. Resumen Ejecutivo del Estado del Sistema

El sistema se encuentra en **estado operativo maduro en producción (v1.2.0)**, con los módulos esenciales de Centro de Control y Monitoreo en Tiempo Real, Gestión de Incidencias Técnicas, Inventario de Cruces Semaforizados, Reportes Gráficos Avanzados y Módulo de Administración de Permisos y Catálogos totalmente operativos.

---

## 2. Matriz de Sprints y Funcionalidades

| Sprint | Nombre / Módulo | Estado | Funcionalidades Principales Entregadas |
|---|---|---|---|
| **Sprint 0** | Setup y Arquitectura | **COMPLETADO** ✅ | Monorepo NestJS + React Vite + PostgreSQL PostGIS + Docker Compose. |
| **Sprint 1** | Autenticación y Usuarios | **COMPLETADO** ✅ | Login JWT, tokens seguros, CRUD de usuarios, roles básicos. |
| **Sprint 2** | Incidencias (Core) | **COMPLETADO** ✅ | Tickets de incidencias, sistema de prioridades, workflow de estados, timeline de seguimientos, asignación a equipos. |
| **Sprint 3** | Dashboard y Mapas Base | **COMPLETADO** ✅ | KPIs del día, mapa Leaflet base, alertas de cruces apagados. |
| **Sprint 4** | Cruces y Periféricos | **COMPLETADO** ✅ | Catálogo de intersecciones viales, inventario de periféricos (controladores, cámaras, UPS), visor de planos DWG/PDF. |
| **Sprint 5** | Estructuras Físicas | **PARCIAL** 🔄 | Catálogo básico de estructuras; queda pendiente el mapeo gráfico 3D/periférico sobre poste. |
| **Sprint 6** | Reportes y Gráficos | **COMPLETADO** ✅ | Reporte interactivo con 5 gráficos Chart.js, exportación a PDF institucional con gráficas y exportación a Excel `.xlsx`. Mapa de calor (Heatmap). |
| **Sprint 7** | Administración y Catálogos | **COMPLETADO** ✅ | Matriz de permisos RBAC granular, catálogo de tipos de incidencia, equipos, reportadores, áreas y tabla de auditoría. |
| **Sprint 8** | Notificaciones y Presencia | **COMPLETADO** ✅ | WebSockets Socket.IO en tiempo real, campana de alertas, auto-notificación de eventos críticos y tracking de sesiones (`user_sessions`). |
| **Sprint 9** | Menús Dinámicos | **COMPLETADO** ✅ | Árbol de menús con Nested Set Model (`lft`/`rght`), reordenamiento dinámico y sincronización automática del sidebar. |
| **Sprint 10** | Clustering Visual Jerárquico | **COMPLETADO** ✅ | Agrupación dinámica por severidad en Leaflet (`leaflet.markercluster`), marcadores temáticos FontAwesome 6, popups Bootstrap 5 y optimización viewport sin scroll. |

---

## 3. Funcionalidades Completamente Implementadas

1. **Centro de Control y Monitoreo en Vivo (Dashboard)**:
   - 5 KPIs en tiempo real (Pendientes Hoy, Cerrados Hoy, Total Activos, Total Resueltos, Cruces Apagados).
   - Clustering dinámico jerárquico por severidad (Rojo = Crítico, Ámbar = Medio, Azul = Normal).
   - Filtros dinámicos por Año, Mes (por defecto mes en curso) y Administrador vial.
   - Popups con fichas técnicas Bootstrap 5 y acceso directo a gestión de ticket.
   - Restricción estricta en tiempo real a tickets activos (`ASIGNADO`, `EN PROCESO`, `REASIGNADO`).

2. **Gestión de Incidencias Técnicas**:
   - Registro con herencia automática de coordenadas de la intersección.
   - Seguimientos con diagnóstico técnico y transiciones de estado.
   - Alerta visual del tiempo transcurrido sin atención.
   - Notificaciones automáticas push/WebSocket ante incidencias críticas.

3. **Gestión de Intersecciones Viales**:
   - Inventario georreferenciado de cruces.
   - Periféricos asociados con IPs y control de contraseñas.
   - Planos técnicos PDF / DWG.

4. **Reportes y Análisis Espacial**:
   - Reporte Gráfico con 5 métricas interactivas.
   - Exportación a PDF con membrete institucional ("División de Monitoreo y Control - SGF - GMU").
   - Exportación a Excel consolidado.
   - Mapa de calor de incidencias con filtros temporales.

5. **Módulo de Seguridad y Administración**:
   - Autenticación JWT y refresco de tokens.
   - Matriz de permisos RBAC por módulo y acción.
   - Tablas maestras y catálogos editables.
   - Auditoría de modificaciones con IP y agente de usuario.

---

## 4. Backlog de Funcionalidades Pendientes y Roadmap Futuro

| ID | Historia de Usuario / Requerimiento | Prioridad | Sprint Sugerido | Descripción |
|---|---|---|---|---|
| **US-029** | Carga de Fotografías y Adjuntos en Incidencias | Alta ⭐ | Sprint 11 | Permitir a las cuadrillas subir fotos de antes/después de la reparación desde campo. |
| **US-030** | Montaje de Periféricos en Estructuras | Media | Sprint 11 | Asociar dispositivos técnicos a la estructura física específica (poste/brazo/gabinete). |
| **US-031** | Sistema de SLA (Tiempos de Respuesta) | Media | Sprint 12 | Definir metas de tiempo por prioridad (ej: Alta < 2h) con semáforos de advertencia antes de vencer. |
| **US-032** | Chat / Mensajería Interna 1:1 | Media | Sprint 12 | Canal de chat directo entre operadores del centro de control y supervisores de campo. |
| **US-033** | App Móvil / PWA de Campo | Baja (Futuro) | Sprint 13+ | Aplicación móvil offline-first para técnicos en vía pública con sincronización al recuperar señal. |
| **US-034** | Integración con APIs de Waze / Tráfico Externo | Baja (Futuro) | Sprint 13+ | Ingesta automática de reportes ciudadanos y alertas de congestión vehicular. |
