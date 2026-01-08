# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.1] - 2026-01-08

### 🔧 Corregido (Fixed)
- **WebSocket**: Configuración de Nginx para proxy de WebSocket (`/socket.io/`)
- **WebSocket**: API proxy corregido de `34.66.18.138:3000` a `127.0.0.1:3001`
- **WebSocket**: Variables de entorno del frontend para usar Nginx como proxy
- **WebSocket**: Registros en `user_sessions` ahora se crean correctamente
- **Timezone**: Columnas de timestamp convertidas a `timestamptz` (timestamp with time zone)
- **Timezone**: Diferencia de hora entre servidor UTC y usuarios en Lima (GMT-5)
- **Configuración**: PM2 cambiado a modo producción (`start:prod`)
- **Nginx**: Eliminada configuración duplicada obsoleta (`monitoreo`)

### 📚 Documentación
- Agregada guía completa de mejores prácticas para zonas horarias
- Documentado fix de WebSocket en `docs/fixes/websocket-user-sessions-fix.md`
- Documentada estandarización de timezone en `docs/fixes/timezone-standardization.md`
- Agregada configuración de Nginx en `config/nginx/alertas-web.conf`

### 🎨 Mejorado (Changed)
- Frontend reconstruido con URLs correctas (sin puerto directo)
- Utilidades de formateo de fechas en `apps/frontend/src/utils/dateUtils.ts`
- Schema de Prisma actualizado con `@db.Timestamptz(3)`

### 🗄️ Base de Datos
- Migración 008: Corrección de tabla `notifications`
- Migración 009: Estandarización de zonas horarias a `timestamptz`

## [1.0.0] - 2026-01-08

### 🎉 Sprint 8: Sistema de Notificaciones en Tiempo Real

### ✨ Agregado (Added)
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

### 🎨 Mejorado (Changed)
- **Gestión de Incidencias**: Interfaz rediseñada con mejor UX
- **Mapa de Incidencias**: Nuevos marcadores dinámicos según estado
- **Seguimiento de Incidencias**: Timeline visual de estados
- **Formularios**: Validación mejorada en tiempo real
- **Performance**: Carga optimizada con lazy loading

### 🗄️ Base de Datos
- Migración 007: Tablas `user_sessions`, `notifications`, `auditoria`, `configuracion`

## [0.7.0] - 2026-01-06

### ✨ Agregado
- **PM2**: Gestión de procesos para desarrollo local
- **Mapa de Calor**: Visualización de incidencias por densidad geográfica
- **Heatmap Filters**: Filtros por año, mes y tipo de incidencia
- **Mi Perfil**: Sección de perfil de usuario editable
- **Configuración**: Página de configuración de cuenta

### 🎨 Mejorado
- **Escalado de Iconos**: Marcadores dinámicos basados en zoom del mapa
- **Filtros Estandarizados**: UI consistente en todos los mantenimientos
- **Paginación Universal**: Implementada en todos los listados
- **Mapa de Cruces**: Carga progresiva con placeholders
- **Estadísticas**: Actualización de página de inicio con métricas en tiempo real

### 🔧 Corregido
- Persistencia de página actual al recargar (F5/Ctrl+R)
- Redirect no deseado al inicio durante inicialización
- Código duplicado en AdministradoresManagement
- Import de useMap en CrucesMap

### 📚 Documentación
- Documentación completa del mapa de calor
- Roadmap de funcionalidades
- Guía de desarrollo con PM2

## [0.6.0] - 2026-01-05

### ✨ Agregado
- **Formulario de Usuarios**: Gestión completa con datos de persona
- **Catálogos**: Endpoints para tipo_docs y estado_civils
- **Seeds**: Datos iniciales para catálogos
- **Filtro de Año**: En mapas de cruces e inicio
- **UI Optimizada**: Placeholders mientras cargan datos
- **Botón de Usuario**: Movido a header para mejor accesibilidad

### 🎨 Mejorado
- **Mapa de Inicio**: Endpoint ligero optimizado
- **Años Dinámicos**: Carga automática de años disponibles
- **Estadísticas Inicio**: Métricas actualizadas y precisas
- **UX del Mapa**: Carga progresiva y modal de detalle

### 🔧 Corregido
- Configuración nginx para producción
- API URL para ambiente de producción
- Schema Prisma con nombres de campos en snake_case
- Referencias a passwordHash eliminadas
- Estado 4 incluido en tickets resueltos
- Campo password_hash eliminado del modelo User

### 🗄️ Base de Datos
- Script automatizado de migraciones
- Seed para tipo_doc y estado_civils
- Corrección de accion_id en schema

### 📚 Documentación
- Actualización completa de documentación
- Sprint 8 documentado

## [0.5.0] - 2026-01-04

### ✨ Agregado
- **Reportes Gráficos**: 5 gráficos interactivos con Chart.js
  - Gráfico de torta: Incidencias por tipo
  - Gráfico de barras: Top 10 cruces con más incidencias
  - Gráfico de barras: Distribución por estado
  - Gráfico de líneas: Evolución temporal
  - Gráfico comparativo: Top 5 averías
- **Exportación PDF**: Reportes con gráficos visuales
- **Filtros Dinámicos**: Día, mes, año con selección intuitiva

### 🎨 Mejorado
- **Performance**: Optimización de consultas de reportes
- **UI/UX**: Interfaz de reportes más intuitiva

## [0.4.0] - 2026-01-03

### ✨ Agregado
- **Gestión de Periféricos**: CRUD completo de periféricos por cruce
- **Detalle de Cruce**: Vista expandida con periféricos asociados
- **Mapa Interactivo**: Leaflet con marcadores personalizados
- **Ficha Técnica PDF**: Exportación de datos de cruces

### 🎨 Mejorado
- **Gestión de Cruces**: Interfaz completa con filtros
- **Visualización**: Tooltips y modales informativos

## [0.3.0] - 2025-12-28

### ✨ Agregado
- **Gestión de Incidencias**: CRUD completo
- **Seguimiento de Estados**: Workflow de incidencias
- **Búsqueda Avanzada**: Múltiples filtros
- **Asignación**: Responsables y equipos

### 🎨 Mejorado
- **Formularios**: Validación mejorada
- **Tablas**: Paginación y ordenamiento

## [0.2.0] - 2025-12-20

### ✨ Agregado
- **Sistema RBAC**: Control de acceso basado en roles
- **Gestión de Usuarios**: CRUD con permisos
- **Gestión de Grupos**: Asignación de permisos
- **Gestión de Menús**: Configuración de accesos
- **Auditoría Básica**: Log de acciones críticas

### 🔒 Seguridad
- JWT con tokens de larga duración
- Hash de contraseñas con bcrypt
- Protección de rutas por permisos

## [0.1.0] - 2025-12-15

### ✨ Agregado
- **Arquitectura Base**: Monorepo con NestJS + React
- **Autenticación JWT**: Login y sesiones
- **Base de Datos**: PostgreSQL + PostGIS
- **ORM Prisma**: Schema inicial
- **UI Base**: Bootstrap 5 + Layout responsivo
- **Documentación API**: Swagger/OpenAPI

### 🏗️ Infraestructura
- Configuración de desarrollo
- Scripts de instalación
- Docker Compose opcional
- Configuración de producción básica

---

## Tipos de Cambios

- **✨ Agregado (Added)**: Nuevas funcionalidades
- **🎨 Mejorado (Changed)**: Cambios en funcionalidades existentes
- **🔧 Corregido (Fixed)**: Corrección de bugs
- **🗑️ Eliminado (Removed)**: Funcionalidades eliminadas
- **🔒 Seguridad (Security)**: Correcciones de seguridad
- **🗄️ Base de Datos**: Cambios en esquema o migraciones
- **📚 Documentación**: Solo cambios en documentación
- **🏗️ Infraestructura**: Cambios en configuración o deployment

## Enlaces

- [Guía de Contribución](CONTRIBUTING.md)
- [Código de Conducta](CODE_OF_CONDUCT.md)
- [Roadmap](docs/ROADMAP.md)
- [Documentación](docs/README.md)
