# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.4.9] - 2026-09-24

### Corregido (Fixed)
- **Estructuración y Limpieza del Menú Lateral (Sidebar)**:
  - Consolidación limpia de los 5 módulos oficiales del sistema (*Incidencias*, *Intersecciones*, *Reportes*, *Mantenimientos*, *Panel de Control*) y desactivación de elementos secundarios huérfanos heredados de CakePHP.
  - Creación de la migración `database/migrations/011-estructurar-sidebar-y-permisos-replicacion.sql` para persistir la jerarquía y permisos en despliegues futuros.
  - Corrección en `menus.service.ts` para tolerar y unificar permisos por acción granular (`view`) y permisos directos por ID.
  - Creación de trigger en PostgreSQL (`trg_set_default_accion`) para auto-asignar acción de lectura a cualquier registro replicado desde la base de datos de producción.

## [1.4.8] - 2026-09-23

### Corregido (Fixed)
- **Codificación y Acentos en Menú Lateral (`Gráficos Estadísticos`)**:
  - Corrección de la codificación de caracteres UTF-8 en la base de datos para el menú `reportes-graficos` (`Gráficos Estadísticos`), `areas_mant` (`Áreas`) y módulos de administración, eliminando los caracteres corruptos `??`.
  - Inclusión de `SET client_encoding TO 'UTF8'` en los scripts de migración de base de datos.
- **Iconos y Marcadores en Tooltip del Gráfico de Evolución (`BiMonthlyTrendChart.tsx`)**:
  - Sustitución de etiquetas de fuentes en el tooltip personalizado de ApexCharts por marcadores geométricos de color HTML con estilos en línea (recuadros para series de barras y círculos para series de líneas), garantizando un renderizado visual perfecto y consistente en todos los navegadores sin fallas de glifos.

## [1.4.7] - 2026-09-23

### Agregado (Added)
- **Filtro por Característica en Dashboard Ejecutivo BI (`/reportes/bi-dashboard`)**:
  - Implementación del filtro desplegable por tipo de característica de incidencia:
    - `Incidencias (I)` (por defecto): Filtra exclusivamente fallas, averías y eventos operativos de semáforos.
    - `Trabajos / Rutinarias (T)`: Tareas preventivas y acciones de rutina.
    - `Todos los tipos (I + T)`: Registro integral consolidado.
  - Sincronización del filtro de característica en todas las consultas de KPIs, series temporales, top causas, distritos, equipos y desglose de estados.

- **Evolución Diaria Dinámica en Series Temporales (`BiMonthlyTrendChart.tsx`)**:
  - Transición automática del gráfico de tendencias al seleccionar un mes específico en la barra de filtros:
    - **Sin mes seleccionado ("Todos los meses")**: Muestra la *Evolución Mensual* agrupada por los 12 meses del año.
    - **Con mes seleccionado**: Cambia dinámicamente a *Evolución Diaria* mostrando todos los días calendario del mes (1..28/29/30/31) con volumen de eventos registrados, resueltos y tiempo promedio de atención en horas.
  - Actualización de títulos y metadatos dinámicos tanto en pantalla como en el informe exportado en PDF institucional.

## [1.4.6] - 2026-09-23

### Mejorado (Changed)
- **Optimización de Rendimiento y Consumo de Datos en Mapa de Intersecciones (`/cruces/mapa`)**:
  - **Endpoint Ligero Dedicado (`GET /api/cruces/mapa`)**: Creación de endpoint con proyección SQL estricta de campos esenciales (`id`, `codigo`, `nombre`, `latitud`, `longitud`, `administradorId`, `tipoGestion`, `tipoComunicacion`, `distrito`, `administradorNombre`) filtrando directamente en base de datos únicamente registros georreferenciados válidos.
  - **Compresión HTTP GZIP/Deflate**: Habilitación del middleware `compression` en NestJS (`main.ts`), reduciendo el tamaño de transferencia de datos de **2.12 MB** a solo **~50 KB** (reducción del **97.6%**).
  - **Optimización de Carga en Frontend (`CrucesMap.tsx`)**: Migración de `crucesService.getCruces({ limit: 10000 })` a `crucesService.getCrucesMapa()`, eliminando latencia de red y sobrecarga de memoria en el navegador.

## [1.4.5] - 2026-09-23

### Agregado (Added)
- **Migración 010 de Estructuración de Menús de Reportes (`010-estructurar-menus-reportes.sql`)**:
  - Estandarización persistente en base de datos de los 4 submódulos analíticos bajo el menú principal `Reportes`:
    1. *Reporte de Incidencias* (`/reportes/incidencias`)
    2. *Gráficos Estadísticos* (`/reportes/grafico`)
    3. *Mapa de Calor* (`/reportes/mapa`)
    4. *Dashboard Ejecutivo BI* (`/reportes/bi-dashboard`)
  - Asignación automática de permisos completos para perfiles `ADMINISTRADOR` y `SUPER_ADMIN`, y permisos de lectura para perfiles `SUPERVISOR`, `OPERADOR` y `CONSULTAS`.
  - Desactivación limpia de menús y ramas obsoletas (`Conteos`, nodos contenedores antiguos).
  - Actualización del script de despliegue y migraciones automáticas `scripts/ejecutar-migraciones.sh` con verificación de menús analíticos.

## [1.4.4] - 2026-09-22

### Corregido (Fixed)
- **Informe Ejecutivo de Intersecciones Semafóricas (PDF)**:
  - Corrección del solapamiento de tablas asegurando el cálculo estricto de la coordenada vertical `y` posterior a cada bloque `autoTable`.
  - Remoción completa de indicadores y columnas de Activos e Inactivos en todas las tarjetas de KPIs y tablas analíticas (Conectividad, Administradores y Cobertura Distrital), optimizando el espacio visual y la legibilidad institucional.

## [1.4.3] - 2026-09-22

### Mejorado (Changed)
- **Informe Ejecutivo de Intersecciones Semafóricas (PDF y Excel)**:
  - Ajuste del título de la sección 2 a `2. Distribución por Administrador`.
  - Simplificación del encabezado de la tabla a `Administrador`.
  - Remoción de las columnas de Activos e Inactivos en la matriz de administradores para una presentación ejecutiva más limpia y focalizada.

## [1.4.2] - 2026-09-22

### Corregido (Fixed)
- **Exportación PDF en Reporte de Incidencias**: Corrección del error de tiempo de ejecución `distrito is not defined` en `ReporteIncidencias.tsx`, mapeando adecuadamente los filtros activos de tipo de incidencia, estado operativo y administrador a los metadatos del informe institucional sin alterar ninguna otra funcionalidad.

## [1.4.1] - 2026-09-22

### Mejorado (Changed)
- **Estandarización y Unificación de Estilos en Todos los Reportes PDF del Sistema**:
  - **Módulo Centralizado (`pdfReportHelper.ts`)**: Creación de una biblioteca transversal con componentes y estilos corporativos oficiales para documentos PDF (jsPDF + autoTable).
  - **Encabezado Institucional Homogéneo**:
    - Cintillo superior azul petróleo (`#1D546D`), título "SISTEMA DE MONITOREO DE SEMÁFOROS", jerarquía "Subgerencia de Gestión y Fiscalización" y "División de Monitoreo y Control", subtítulo de reporte y logotipo oficial de la Municipalidad Metropolitana de Lima en alta resolución.
    - Encabezado compacto automático para páginas secundarias con información de contexto y período.
  - **Pie de Página Institucional**: Cintillo divisor con leyenda oficial "Municipalidad Metropolitana de Lima", paginación dinámica "Página X de Y" y fecha de emisión.
  - **Módulos Actualizados al Nuevo Estándar**:
    - *Reporte Estadístico de Incidencias y Averías* (`/reportes/graficos`)
    - *Reporte de Gestión de Incidencias* (`/reportes/incidencias`)
    - *Dashboard Ejecutivo BI* (`/reportes/bi-dashboard`)
    - *Informe Ejecutivo de Intersecciones Semafóricas* (`/cruces`)
    - *Ficha Técnica de Intersección Semafórica* (`CruceDetail.tsx`)

## [1.4.0] - 2026-09-22

### Agregado (Added)
- **Exportación a Excel y Reporte Ejecutivo PDF en Gestión de Intersecciones**:
  - **Exportación a Excel (`.xlsx`)**: Generación de archivo Excel institucional con dos pestañas de datos procesados:
    - *Listado de Intersecciones*: Matriz exhaustiva con 23 columnas que abarcan Código de cruce, Nombre/Intersección, Distrito, Provincia, Estado Operativo, Tipo de Comunicación/Red, Administrador/Contratista, Proyecto, Tipo de Cruce, Tipo de Estructura, Tipo de Control, Coordenadas GPS (Latitud/Longitud), Cantidad de Periféricos vinculados, Disponibilidad de Planos técnicos (PDF y DWG), Empresa Eléctrica, Suministro Eléctrico, Año de Implementación, Observaciones y Fecha de Registro.
    - *Resumen Ejecutivo*: Pestaña analítica integrada con tablas consolidadas de KPIs generales, distribución por tipo de comunicación, administradores y ranking de cobertura por distritos.
  - **Reporte Ejecutivo Institucional en PDF**: Generación en cliente con `jsPDF` y `jspdf-autotable` con membrete oficial de la Municipalidad Metropolitana de Lima (GMU / SGF), tarjetas de métricas clave (Total cruces, % Operatividad, cruces activos/inactivos, cruces con planos, cruces con periféricos), desglose tabular por Tipo de Comunicación y Red, resumen por Administrador/Contratista y matriz de Cobertura Semafórica por Distritos con pie de página y paginación institucional.
  - **Endpoints Backend**:
    - `GET /api/cruces/export/excel`: Generación binaria y streaming optimizado con `ExcelJS` aplicando estilos, cabeceras personalizadas, anchos automáticos y autofiltros.
    - `GET /api/cruces/resumen-ejecutivo`: Agregación analítica de datos en PostgreSQL para cálculo rápido de métricas e indicadores de la red semafórica.

## [1.3.2] - 2026-09-22

### Corregido (Fixed)
- **Eliminación de Scroll Horizontal y Adaptabilidad de Pantalla**:
  - Corrección de márgenes negativos (`-1.5rem`) en `.app-page-title` que desbordaban el ancho del contenedor `container-fluid p-3`.
  - Configuración global de `box-sizing: border-box`, `overflow-x: hidden`, `max-width: 100%` en `html`, `body`, `#root`, `container-fluid` y `Layout.tsx` (`minWidth: 0`, `overflowX: 'hidden'`).
  - Adaptabilidad fluida del viewport a cualquier resolución de pantalla, manteniendo el scroll horizontal encapsulado únicamente dentro de `.table-responsive` para tablas con columnas extensas.

## [1.3.1] - 2026-09-22

### Corregido (Fixed)
- **Gestión de Permisos de Grupo**: Corrección del método de guardado masivo en el frontend (`admin.service.ts`), resolviendo la excepción `assignToGrupo is not a function` que impedía guardar la matriz de privilegios en el módulo de perfiles y seguridad.
- **Robustez en Backend de Permisos**: Inclusión de `skipDuplicates: true` en la persistencia masiva de permisos de grupo (`bulkSavePermisos`) para prevenir conflictos de llaves únicas en PostgreSQL.

## [1.3.0] - 2026-09-22

### Agregado (Added)
- **Dashboard Ejecutivo BI (Réplica Power BI)**: Nuevo módulo analítico y gerencial integrado (`/reportes/bi-dashboard`) basado en los reportes ejecutivos `SGF-KPI` y `SGF-MONITOREO` del archivo `archive/GMU - Reportes .pbix`:
  - **KPIs Ejecutivos en Tiempo Real**: Tarjetas de indicadores clave (Total Incidencias, Incidencias Resueltas, % Resolución, Intersecciones Afectadas, Tiempo Promedio de Respuesta en horas y días, Incidencias Críticas).
  - **Evolución Mensual (Volumen vs Tiempo)**: Gráfico de doble eje con series de volumen de incidencias y curva de tiempo promedio de atención en horas.
  - **Top 10 Causas y Averías**: Gráfico horizontal de distribución con diferenciación por severidad (Críticas vs Estándar) y porcentajes de participación.
  - **Matriz Analítica por Distritos**: Tabla con ranking de incidencias, cruces afectados, volumen de resueltas, buscador reactivo, ordenamiento por columnas y barras de porcentaje de efectividad.
  - **Carga y Desempeño de Cuadrillas**: Gráfico comparativo de tareas asignadas vs resueltas por equipo y tiempo promedio.
  - **Distribución por Estado**: Gráfico Donut de flujo de atención de tickets.
  - **Segmentación Multidimensional (Slicers)**: Filtrado reactivo por Año, Mes, Distrito, Administrador/Contratista y Equipo de Trabajo.
  - **Exportación Ejecutiva a PDF y CSV**: Generación de informes PDF institucionales en alta definición con membrete municipal y exportación de matrices a CSV.
- **Backend Analytics Engine**: Endpoints dedicados bajo `/api/reportes/bi-dashboard/*` con consultas SQL agrupadas de alta velocidad.

## [1.2.0] - 2026-09-19

### Agregado (Added)
- **Clustering Visual Jerárquico por Severidad en Mapa (Leaflet)**: Agrupación dinámica con `leaflet.markercluster` en el mapa del Centro de Control (`Inicio.tsx`).
  - **Cluster Rojo (Crítico)**: Grupo con al menos una incidencia de alta prioridad, cruce apagado (`id: 66`) o siniestro.
  - **Cluster Ámbar / Amarillo (Medio)**: Grupo con incidencias medias o en proceso.
  - **Cluster Azul Marino (Normal / Bajo)**: Grupo con incidencias leves o estado operativo.
  - **Marcadores Individuales**: Icono de triángulo de advertencia rojo (`fa-triangle-exclamation`) para incidentes críticos y semáforo azul (`fa-traffic-light`) para cruces normales.
  - **Popups Bootstrap 5**: Tarjetas interactivas con código de cruce, vías, distrito, severidad, estado y botón de gestión rápida de incidencias.
- **Filtro de Mes Dinámico en Mapa**: Selector de mes con opción "Todos" y selección automática del mes actual según fecha del sistema.
- **Estructuración del Repositorio**: Centralización ordenada de documentación en carpeta `/docs`, scripts ejecutables en `/scripts` y archivos históricos en `/archive`.

- **Filtros en Gestión de Incidencias**: Corrección de carga de catálogos (`loadCatalogs`), soporte para filtrado múltiple por estados (`estadoId`), rango de fechas (`fechaDesde`, `fechaHasta`), jerarquía padre/hijo en tipos de incidencias y renderizado con react-select portals.
- **Filtro Estricto de Incidencias Activas en Mapa**: El endpoint `getMapMarkers` y la vista de inicio ahora filtran estrictamente por tickets activos (`1: ASIGNADO`, `2: EN PROCESO`, `5: REASIGNADO`), excluyendo tickets finalizados y cancelados que aparecían al seleccionar año/mes.
- **Paginación en Gestión de Intersecciones**: Corrección del error al avanzar de página en el listado de cruces/intersecciones.
- **Exportación PDF en Reporte Gráfico**: Inclusión de las gráficas estadísticas renderizadas en el documento exportado con el membrete institucional actualizado.
- **Estandarización de Terminología**: Unificación del término "Intersección / Intersecciones" en todas las vistas del sistema.
- **Ajuste de Vista Sin Scroll**: Dashboard de inicio ajustado al 100% del alto de pantalla sin desbordes verticales.

### Mejorado (Changed)
- **Reordenamiento de Menús**: Módulo de Intersecciones reubicado inmediatamente después de Incidencias en la barra lateral.
- **Limpieza de Menús**: Removida la opción no implementada de "Conteo Mensual" y eliminado el menú contextual redundante en Intersecciones.
- **Pie de Página Institucional**: Actualizado a "División de Monitoreo y Control - SGF - GMU".

## [1.1.6] - 2026-01-13

### Mejorado (Changed)
- **Optimización Crítica del Mapa de Calor**: Los datos ahora se filtran en el backend (SQL) en lugar del frontend, reduciendo drásticamente la transferencia de datos
- **Filtrado Dinámico**: Cada cambio de filtro (año, mes, tipo) recarga datos filtrados desde el backend, eliminando la carga inicial de 10,000 registros (17.5MB)
- **Performance Mejorada**: El endpoint `/incidents/map-markers` ahora acepta parámetros `year`, `month` e `incidenciaId` para filtrar en SQL
- **Carga Automática por Filtros**: useEffect recarga datos automáticamente cuando cambian los filtros (year, month, tipo)

### Técnico (Technical)
- Backend: Agregados parámetros `year` y `month` a `QueryIncidentsDto`
- Backend: Método `getMapMarkers` ahora filtra por rango de fechas usando `createdAt` y por `incidenciaId`
- Frontend: `loadData()` envía filtros actuales como query params al backend
- Frontend: Eliminado `applyFilters()` - datos vienen prefiltrados del backend
- Frontend: `QueryIncidentsDto` actualizado con campos `year` y `month`

## [1.1.5] - 2026-01-13

### Mejorado (Changed)
- **Optimización Mapa de Calor**: El mapa de calor ahora carga por defecto datos filtrados del mes y año actual, evitando cargar 10,000 registros al inicio
- **Filtros por Defecto**: Los filtros de año y mes se inicializan automáticamente con la fecha actual para mejor rendimiento

### Agregado (Added)
- **Versión en Footer**: La versión del sistema ahora se muestra en el footer junto al copyright (© 2026 Sistema de Monitoreo v1.1.5)

## [1.1.4] - 2026-01-13

### Mejorado (Changed)
- **Visualización Jerárquica de Menús en Permisos**: Los menús en la gestión de grupos y permisos ahora se muestran de forma jerárquica con indentación, similar a la gestión de menús
- **Carga Dinámica de Menús**: Los menús se cargan dinámicamente desde la base de datos usando el endpoint `/menus/tree` con niveles calculados
- **Mejor UX en Permisos**: Menus padre destacados con color azul y fondo diferenciado, submenús con indentación y símbolo └─
- **Información Completa de Menús**: Se muestra icono, nombre, módulo y ruta de cada menú en la matriz de permisos
- **Filtrado de Menús Activos**: Solo se muestran menús activos en la asignación de permisos
- **Acceso a Catálogos sin Permisos Específicos**: Los endpoints GET de tipos, grupos, acciones, áreas, equipos y reportadores ya no requieren permisos específicos, permitiendo su uso en filtros de otros módulos

### Agregado (Added)
- **Método getTree() en menusService**: Nuevo endpoint en frontend para obtener menús con jerarquía
- **Campos adicionales en interfaz Menu**: Agregados campos `nivel` y `menuPadreId` para soporte jerárquico
- **Logs de depuración**: Consola muestra cantidad de menús cargados para facilitar diagnóstico
- **Mensaje informativo**: Indicador visual cuando no hay menús disponibles

### Corregido (Fixed)
- **Permisos de catálogos**: Los endpoints de tipos, grupos, acciones, áreas, equipos y reportadores ahora solo requieren autenticación (JwtAuthGuard) para consultas GET, permitiendo su uso en filtros
- **Permisos de escritura**: POST, PATCH y DELETE de catálogos ahora requieren permisos específicos del módulo correspondiente

### Técnico
- Archivo `.copilot-context.md` creado con información de entornos y credenciales
- Documentación de uso de PM2 para gestión de procesos en local
- Controladores actualizados: tipos, grupos, acciones, áreas, equipos, reportadores

## [1.1.3] - 2026-01-10

### Agregado (Added)
- **Gestión de Grupos**: CRUD completo para grupos/perfiles con modal
- **Toggle Estado Usuarios**: Botón para activar/desactivar usuarios
- **Eliminar Usuarios**: Eliminación permanente solo para SUPER_ADMIN

### Corregido (Fixed)
- **Z-index Header**: Dropdowns de notificaciones y usuario ahora aparecen sobre todos los componentes
- **Campos Persona**: Corregido mapeo de campos snake_case (num_doc, ape_pat, ape_mat) en edición de usuarios
- **Filtro Fechas Inicio**: Corrección de zona horaria en "Pendientes Hoy" usando comparación de strings YYYY-MM-DD
- **Filtro Fechas Dashboard**: Período "today" corregido para zona horaria local
- **Filtro Fechas Tickets**: Rango de fechas en listado de incidencias corregido
- **Filtro Fechas Mapa Calor**: Filtros de año/mes corregidos para zona horaria

### Técnico
- Las fechas de la BD se almacenan como `timestamp without time zone` (hora local Perú)
- Prisma devuelve fechas con sufijo Z (UTC), causando desfase de 5 horas
- Solución: Comparar fechas usando strings YYYY-MM-DD en lugar de objetos Date

## [1.1.2] - 2026-01-09

### Agregado (Added)
- **Gestion de Menus**: Sistema completo con Tree Behavior (Nested Set Model)
- **Permisos Automaticos**: Auto-asignacion de permisos a SUPER_ADMIN al crear menus
- **Sidebar Dinamico**: Auto-refresh de menus en sidebar despues de cambios
- **Endpoint /auth/me**: Obtener datos actualizados del usuario autenticado
- **Endpoint /permisos/bulk-save**: Guardado masivo de permisos compatible con frontend
- **Campo dia en filtros**: Soporte para filtrar reportes por dia especifico

### Corregido (Fixed)
- **Filtro DIA en reportes**: Ahora usa el dia/mes/anio seleccionado en lugar de fecha actual
- **Codigo unico de menus**: Validacion ConflictException para codigos duplicados
- **Calculo de nivel en arbol**: Corregido usando conteo de ancestros Nested Set
- **Permisos en endpoints**: Permitir acceso cuando el menu no existe en BD
- **WebSocket/CORS**: Mejorado manejo de errores y configuracion CORS
- **Navegacion sin parpadeo**: Layout compartido con Outlet para evitar page jumps
- **Suspense optimizado**: Movido dentro del Layout para evitar flicker completo

### Mejorado (Changed)
- **App.tsx**: Refactorizado con ProtectedLayout compartido y rutas anidadas
- **PermissionsGuard**: Logica mejorada para validar permisos dinamicamente
- **calcularRangoFechas()**: Soporte completo para periodo DIA con parametros

### Documentacion
- Actualizada documentacion de gestion de menus con permisos automaticos
- Agregada seccion de troubleshooting en documentacion

## [1.0.1] - 2026-01-08

### Corregido (Fixed)
- **WebSocket**: Configuración de Nginx para proxy de WebSocket (`/socket.io/`)
- **WebSocket**: API proxy corregido de `34.66.18.138:3000` a `127.0.0.1:3001`
- **WebSocket**: Variables de entorno del frontend para usar Nginx como proxy
- **WebSocket**: Registros en `user_sessions` ahora se crean correctamente
- **Timezone**: Columnas de timestamp convertidas a `timestamptz` (timestamp with time zone)
- **Timezone**: Diferencia de hora entre servidor UTC y usuarios en Lima (GMT-5)
- **Configuración**: PM2 cambiado a modo producción (`start:prod`)
- **Nginx**: Eliminada configuración duplicada obsoleta (`monitoreo`)

### Documentación
- Agregada guía completa de mejores prácticas para zonas horarias
- Documentado fix de WebSocket en `docs/fixes/websocket-user-sessions-fix.md`
- Documentada estandarización de timezone en `docs/fixes/timezone-standardization.md`
- Agregada configuración de Nginx en `config/nginx/alertas-web.conf`

### Mejorado (Changed)
- Frontend reconstruido con URLs correctas (sin puerto directo)
- Utilidades de formateo de fechas en `apps/frontend/src/utils/dateUtils.ts`
- Schema de Prisma actualizado con `@db.Timestamptz(3)`

### Base de Datos
- Migración 008: Corrección de tabla `notifications`
- Migración 009: Estandarización de zonas horarias a `timestamptz`

## [1.0.0] - 2026-01-08

### Sprint 8: Sistema de Notificaciones en Tiempo Real

### Agregado (Added)
- **WebSocket Gateway**: Sistema de notificaciones en tiempo real con Socket.IO
- **Notificaciones Push**: Alertas instantáneas de nuevas incidencias
- **Bell de Notificaciones**: Campana con contador en tiempo real
- **Panel de Notificaciones**: Lista interactiva con filtros y paginación
- **Sesiones de Usuario**: Tracking de conexiones WebSocket activas
- **Auditoría**: Sistema de registro de acciones de usuarios
- **Configuración Global**: Tabla para parámetros del sistema
- **Toast Notifications**: Notificaciones emergentes con auto-hide
- **Búsqueda Avanzada**: Filtros por estado, fecha, responsable y reportador
- **Exportación Excel**: Reporte consolidado de incidencias en matriz

### Mejorado (Changed)
- **Gestión de Incidencias**: Interfaz rediseñada con mejor UX
- **Mapa de Incidencias**: Nuevos marcadores dinámicos según estado
- **Seguimiento de Incidencias**: Timeline visual de estados
- **Formularios**: Validación mejorada en tiempo real
- **Performance**: Carga optimizada con lazy loading

### Base de Datos
- Migración 007: Tablas `user_sessions`, `notifications`, `auditoria`, `configuracion`

## [0.7.0] - 2026-01-06

### Agregado
- **PM2**: Gestión de procesos para desarrollo local
- **Mapa de Calor**: Visualización de incidencias por densidad geográfica
- **Heatmap Filters**: Filtros por año, mes y tipo de incidencia
- **Mi Perfil**: Sección de perfil de usuario editable
- **Configuración**: Página de configuración de cuenta

### Mejorado
- **Escalado de Iconos**: Marcadores dinámicos basados en zoom del mapa
- **Filtros Estandarizados**: UI consistente en todos los mantenimientos
- **Paginación Universal**: Implementada en todos los listados
- **Mapa de Cruces**: Carga progresiva con placeholders
- **Estadísticas**: Actualización de página de inicio con métricas en tiempo real

### Corregido
- Persistencia de página actual al recargar (F5/Ctrl+R)
- Redirect no deseado al inicio durante inicialización
- Código duplicado en AdministradoresManagement
- Import de useMap en CrucesMap

### Documentación
- Documentación completa del mapa de calor
- Roadmap de funcionalidades
- Guía de desarrollo con PM2

## [0.6.0] - 2026-01-05

### Agregado
- **Formulario de Usuarios**: Gestión completa con datos de persona
- **Catálogos**: Endpoints para tipo_docs y estado_civils
- **Seeds**: Datos iniciales para catálogos
- **Filtro de Año**: En mapas de cruces e inicio
- **UI Optimizada**: Placeholders mientras cargan datos
- **Botón de Usuario**: Movido a header para mejor accesibilidad

### Mejorado
- **Mapa de Inicio**: Endpoint ligero optimizado
- **Años Dinámicos**: Carga automática de años disponibles
- **Estadísticas Inicio**: Métricas actualizadas y precisas
- **UX del Mapa**: Carga progresiva y modal de detalle

### Corregido
- Configuración nginx para producción
- API URL para ambiente de producción
- Schema Prisma con nombres de campos en snake_case
- Referencias a passwordHash eliminadas
- Estado 4 incluido en tickets resueltos
- Campo password_hash eliminado del modelo User

### Base de Datos
- Script automatizado de migraciones
- Seed para tipo_doc y estado_civils
- Corrección de accion_id en schema

### Documentación
- Actualización completa de documentación
- Sprint 8 documentado

## [0.5.0] - 2026-01-04

### Agregado
- **Reportes Gráficos**: 5 gráficos interactivos con Chart.js
  - Gráfico de torta: Incidencias por tipo
  - Gráfico de barras: Top 10 cruces con más incidencias
  - Gráfico de barras: Distribución por estado
  - Gráfico de líneas: Evolución temporal
  - Gráfico comparativo: Top 5 averías
- **Exportación PDF**: Reportes con gráficos visuales
- **Filtros Dinámicos**: Día, mes, año con selección intuitiva

### Mejorado
- **Performance**: Optimización de consultas de reportes
- **UI/UX**: Interfaz de reportes más intuitiva

## [0.4.0] - 2026-01-03

### Agregado
- **Gestión de Periféricos**: CRUD completo de periféricos por cruce
- **Detalle de Cruce**: Vista expandida con periféricos asociados
- **Mapa Interactivo**: Leaflet con marcadores personalizados
- **Ficha Técnica PDF**: Exportación de datos de cruces

### Mejorado
- **Gestión de Cruces**: Interfaz completa con filtros
- **Visualización**: Tooltips y modales informativos

## [0.3.0] - 2025-12-28

### Agregado
- **Gestión de Incidencias**: CRUD completo
- **Seguimiento de Estados**: Workflow de incidencias
- **Búsqueda Avanzada**: Múltiples filtros
- **Asignación**: Responsables y equipos

### Mejorado
- **Formularios**: Validación mejorada
- **Tablas**: Paginación y ordenamiento

## [0.2.0] - 2025-12-20

### Agregado
- **Sistema RBAC**: Control de acceso basado en roles
- **Gestión de Usuarios**: CRUD con permisos
- **Gestión de Grupos**: Asignación de permisos
- **Gestión de Menús**: Configuración de accesos
- **Auditoría Básica**: Log de acciones críticas

### Seguridad
- JWT con tokens de larga duración
- Hash de contraseñas con bcrypt
- Protección de rutas por permisos

## [0.1.0] - 2025-12-15

### Agregado
- **Arquitectura Base**: Monorepo con NestJS + React
- **Autenticación JWT**: Login y sesiones
- **Base de Datos**: PostgreSQL + PostGIS
- **ORM Prisma**: Schema inicial
- **UI Base**: Bootstrap 5 + Layout responsivo
- **Documentación API**: Swagger/OpenAPI

### Infraestructura
- Configuración de desarrollo
- Scripts de instalación
- Docker Compose opcional
- Configuración de producción básica

---

## Tipos de Cambios

- **Agregado (Added)**: Nuevas funcionalidades
- **Mejorado (Changed)**: Cambios en funcionalidades existentes
- **Corregido (Fixed)**: Corrección de bugs
- **Eliminado (Removed)**: Funcionalidades eliminadas
- **Seguridad (Security)**: Correcciones de seguridad
- **Base de Datos**: Cambios en esquema o migraciones
- **Documentación**: Solo cambios en documentación
- **Infraestructura**: Cambios en configuración o deployment

## Enlaces

- [Documentación](docs/README.md)
