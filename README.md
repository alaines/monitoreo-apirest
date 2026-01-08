# Sistema de Monitoreo de Semaforos e Incidencias

[![Version](https://img.shields.io/badge/version-1.0.1-blue.svg)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

Sistema integral de gestion y monitoreo de cruces semaforizados e incidencias de trafico en tiempo real. Monorepo fullstack desarrollado con NestJS, React, PostgreSQL y PostGIS.

## Autor

Aland Laines Calonge

## 📚 Documentación de Instalación

- **[📖 Guía de Instalación Completa](docs/INSTALLATION.md)** - Instalación detallada para desarrollo y producción
- **[⚡ Guía Rápida](docs/guides/GUIA-RAPIDA.md)** - Inicio rápido para desarrollo
- **[🔧 Configuración de Servidor](docs/architecture/SERVER-CONFIG.md)** - Configuración técnica de servidores
- **[📋 CHANGELOG](CHANGELOG.md)** - Historial de cambios y versiones
- **[🏷️ Versionado](docs/guides/VERSIONING.md)** - Guía de versionado y releases

## ⚡ Instalación Rápida

### Desarrollo Local (Con PM2 - Recomendado)
```bash
# 1. Clonar y entrar al proyecto
git clone https://github.com/alaines/monitoreo-apirest.git
cd monitoreo-apirest

# 2. Instalar dependencias
npm install

# 3. Configurar PostgreSQL
createdb monitoreo
psql -d monitoreo -f database/current-schema.sql
psql -d monitoreo -f database/init.sql

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 5. Iniciar aplicación con PM2
npm run dev

# Comandos útiles de PM2:
npm run dev:status   # Ver estado de los servicios
npm run dev:logs     # Ver logs en tiempo real
npm run dev:restart  # Reiniciar servicios
npm run dev:stop     # Detener servicios
npm run dev:delete   # Eliminar servicios de PM2
```

**Acceder:** http://localhost:5173  
**Credenciales:** `admin` / `Admin123` (cambiar después del primer login)

### Producción (Instalación Automática)
```bash
# Clonar repositorio
git clone https://github.com/alaines/monitoreo-apirest.git
cd monitoreo-apirest

# Ejecutar instalador (requiere sudo)
sudo ./scripts/install-production.sh
```

El script instalará automáticamente:
- ✅ Node.js 20
- ✅ PostgreSQL + PostGIS
- ✅ PM2 (gestor de procesos)
- ✅ Base de datos con usuario admin
- ✅ Servicios configurados y corriendo

Ver [Guía de Instalación](docs/INSTALLATION.md) para instalación manual o personalización.

## Descripcion

Aplicacion web profesional para la gestion, seguimiento y analisis de cruces semaforizados, perifericos asociados e incidencias de trafico. Permite el registro completo de infraestructura vial, gestion de perifericos tecnicos, seguimiento de incidencias ciudadanas, y visualizacion geografica mediante mapas interactivos con priorizacion por nivel de urgencia.

## Capturas de Pantalla

### Pantalla de Inicio
![Inicio](docs/screenshots/inicio.PNG)

### Login
![Login](docs/screenshots/login.PNG)

### Gestion de Cruces
![Gestion de Cruces](docs/screenshots/gestion_cruces.PNG)

### Mapa de Cruces Semaforizados
![Mapa de Cruces](docs/screenshots/mapa_cruces.PNG)

### Detalle de Cruce con Perifericos
![Detalle de Cruce](docs/screenshots/detalle_cruce.PNG)

### Gestion de Incidencias
![Gestion de Incidencias](docs/screenshots/gestion_incidencias.PNG)

### Detalle de Incidencia
![Detalle de Incidencia](docs/screenshots/detalle_incidencia.PNG)

## Caracteristicas Principales

### Gestion de Cruces Semaforizados
- Registro completo de intersecciones viales con informacion tecnica
- Catalogacion jerarquica por tipo de cruce, gestion, operacion, control y comunicacion
- Ubicacion geografica mediante coordenadas (latitud/longitud)
- Administracion por entidades responsables (municipalidad, region, etc.)
- Asociacion con distritos y ejes viales (avenidas, calles)
- Carga de planos tecnicos en formatos PDF y DWG
- Visualizacion geografica en mapa interactivo con filtros avanzados
- Exportacion de fichas tecnicas a PDF
- Informacion detallada de infraestructura electrica

### Gestion de Perifericos
- Inventario completo de dispositivos tecnicos asociados a cruces
- Clasificacion por tipo (controladores, camaras, detectores, GPS, UPS, etc.)
- Registro de fabricante, modelo y numero de serie
- Configuracion de red (IP, credenciales de acceso)
- Control de garantias y estados operacionales
- Asociacion multiple periferico-cruce
- Visualizacion de detalles con proteccion de credenciales sensibles
- Sistema de gestion de passwords con opcion de mostrar/ocultar

### Gestion de Incidencias
- Registro y catalogacion de incidencias de trafico y fallas en cruces
- Sistema de prioridades (Alta, Media, Baja)
- Asignacion a equipos tecnicos especializados
- Seguimiento del ciclo de vida completo
- Heredamiento automatico de coordenadas desde cruces
- Calculo automatico de tiempo transcurrido con alertas visuales
- Sistema de tracking con timeline visual y historial completo
- Restriccion de modificaciones en incidencias finalizadas
- Filtros avanzados con busqueda de tipo y seleccion multiple de estados
- Monitoreo especial de "Cruces Apagados" en dashboard
- Notificaciones en tiempo real para incidencias criticas

### Mapas Interactivos
- Mapa de cruces con marcadores diferenciados por administrador
- Mapa de incidencias con codigo de colores segun prioridad
- Filtros geograficos avanzados (tipo gestion, comunicacion, administrador)
- Capas personalizables (OpenStreetMap, Satelite, Topografico)
- Popups informativos con datos contextuales y enlaces a detalles
- Iconos personalizados tipo pin con semaforos internos
- Vista responsiva adaptada a diferentes resoluciones

### Dashboard Analitico
- Estadisticas en tiempo real de incidencias
- Filtros por periodo temporal (Hoy, Semana, Mes, Ano, Todas)
- Indicadores de rendimiento (KPIs): activas, pendientes, en progreso
- Metricas de tiempo promedio de resolucion
- Card especial "Cruces Apagados" con contador en vivo
- Integracion con mapas para analisis espacial
- Sistema de notificaciones en tiempo real con WebSockets
- Campana de notificaciones con contador de alertas no leidas

### Sistema de Reportes
- **Reporte de Incidencias**: Estadisticas detalladas con exportacion a PDF
- **Reporte Grafico**: Visualizacion con Chart.js (5 graficos interactivos)
  * Grafico de torta: Incidencias por tipo (filtradas por "PROBLEMA - CRUCE")
  * Grafico de barras: Top 10 cruces con mas incidencias
  * Grafico de barras: Distribucion por estado
  * Grafico de lineas: Evolucion temporal adaptativa (hora/dia/mes segun periodo)
  * Grafico de barras comparativo: Top 5 averias (atendidas vs por atender)
- Filtros dinamicos: Dia, Mes, Ano con seleccion intuitiva
- Exportacion a PDF con graficos visuales (no tablas)
- Clasificacion de estados: Atendidas (ATENDIDO, CERRADO, FINALIZADO, RESUELTO, COMPLETADO)
- Exportacion a Excel con formato consolidado (matriz cruces x tipos)

### Sistema de Autenticacion
- Autenticacion JWT segura con tokens de larga duracion
- Control de acceso basado en roles (RBAC)
- Gestion de usuarios con permisos granulares
- Sesiones persistentes y proteccion de rutas

### Interfaz de Usuario
- Diseno responsive profesional con Bootstrap 5
- Menu lateral con submenus expandibles (cruces con gestion y mapa)
- Formularios con validacion en tiempo real
- Tooltips descriptivos en acciones criticas
- Modales para visualizacion de contenido detallado
- Conversion automatica a mayusculas para consistencia
- Exportacion de documentos PDF con fichas tecnicas

## Arquitectura Tecnica

### Backend
- Framework: NestJS 10.x
- ORM: Prisma con cliente autogenerado
- Base de Datos: PostgreSQL 13+ con extension PostGIS
- Autenticacion: JWT con Passport.js
- WebSockets: Socket.IO para notificaciones en tiempo real
- Documentacion API: Swagger/OpenAPI
- Validacion: class-validator y class-transformer
- Gestion de Archivos: Multer con almacenamiento en disco

### Frontend
- Framework: React 18.x con hooks
- Herramienta de Build: Vite
- Lenguaje: TypeScript con tipado estricto
- UI Framework: Bootstrap 5.3.8
- Gestion de Estado: Zustand para estado global
- WebSockets: socket.io-client para notificaciones en tiempo real
- Mapas: Leaflet con React Leaflet
- Enrutamiento: React Router v6
- Graficos: Chart.js 4.x con react-chartjs-2
- Generacion PDF: jsPDF con autotable (frontend only)
- Cliente HTTP: Axios con interceptores

### Base de Datos
- Motor: PostgreSQL 13+
- Extension Espacial: PostGIS para datos geoespaciales
- Esquema: Normalizado con relaciones y constraints
- Tipos Espaciales: Geometrias point para coordenadas
- Indices: Optimizados para consultas geograficas y busquedas

## Requisitos del Sistema

- Node.js 18.0.0 o superior
- npm 9.0.0 o superior
- PostgreSQL 13+ con extension PostGIS instalada y habilitada
- Git para control de versiones
- Sistema operativo: Linux, macOS o Windows

## Instalacion

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd monitoreo-apirest
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env` en la raiz del proyecto:

```env
# Base de Datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/monitoreo_db?schema=public"

# Configuracion JWT
JWT_SECRET=tu_clave_secreta_muy_segura_aqui
JWT_EXPIRES_IN=7d

# Backend
PORT=3001
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3001/api
```

### 4. Configurar base de datos

```bash
# Crear la base de datos
createdb monitoreo_db

# Habilitar extension PostGIS
psql monitoreo_db -c "CREATE EXTENSION postgis;"

# Ejecutar migraciones de Prisma
cd apps/backend
npx prisma migrate dev

# Generar cliente Prisma
npx prisma generate
```

### 5. Cargar datos iniciales (opcional)

```bash
# Desde apps/backend
npx prisma db seed
```

### 6. Iniciar aplicacion

```bash
# Volver a la raiz del proyecto
cd ../..

# Desarrollo - Backend y Frontend
npm run dev

# Solo backend (puerto 3001)
npm run dev:backend

# Solo frontend (puerto 5173)
npm run dev:frontend
```

## Uso

### Desarrollo

```bash
# Iniciar backend y frontend simultaneamente
npm run dev

# Backend con hot-reload (puerto 3001)
npm run dev:backend

# Frontend con Vite HMR (puerto 5173)
npm run dev:frontend

# Abrir Prisma Studio (explorador de BD)
cd apps/backend && npx prisma studio
```

### Produccion

```bash
# Compilar backend
cd apps/backend
npm run build

# Compilar frontend
cd ../frontend
npm run build

# Iniciar backend en produccion
cd ../backend
npm run start:prod

# Servir frontend (con servidor web como nginx o serve)
cd ../frontend
npx serve -s dist
```

## Estructura del Proyecto

```
monitoreo-apirest/
├── apps/
│   ├── backend/                    # API REST NestJS
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Esquema de base de datos
│   │   │   └── migrations/        # Migraciones SQL
│   │   ├── src/
│   │   │   ├── auth/              # Autenticacion JWT y guards
│   │   │   ├── cruces/            # Modulo de cruces semaforizados
│   │   │   ├── perifericos/       # Modulo de perifericos tecnicos
│   │   │   ├── incidents/         # Modulo de incidencias
│   │   │   ├── tipos/             # Catalogos jerarquicos
│   │   │   ├── ubigeos/           # Division geografica administrativa
│   │   │   ├── administradores/   # Entidades administradoras
│   │   │   ├── ejes/              # Vias y avenidas
│   │   │   └── users/             # Gestion de usuarios
│   │   └── uploads/               # Archivos estaticos (planos, documentos)
│   │
│   └── frontend/                   # Aplicacion React
│       ├── public/                # Assets estaticos
│       └── src/
│           ├── components/        # Componentes reutilizables
│           │   ├── Layout.tsx    # Layout principal con menu lateral
│           │   └── ...           
│           ├── features/          # Modulos por funcionalidad
│           │   ├── auth/         # Login y sesion
│           │   ├── cruces/       # Gestion de cruces y mapa
│           │   │   ├── CrucesList.tsx
│           │   │   ├── CruceDetail.tsx
│           │   │   ├── CruceForm.tsx
│           │   │   └── CrucesMap.tsx
│           │   ├── incidents/    # Gestion de incidencias
│           │   └── users/        # Administracion de usuarios
│           ├── pages/            # Paginas principales
│           │   ├── Dashboard.tsx # Dashboard analitico
│           │   ├── Inicio.tsx    # Mapa de inicio
│           │   └── ...
│           ├── services/         # Clientes API (Axios)
│           └── utils/            # Utilidades y helpers
│
├── database/                      # Scripts SQL adicionales
├── docs/                          # Documentacion del proyecto
├── package.json                   # Configuracion monorepo
└── README.md
```

## API Endpoints Principales

### Autenticacion
- `POST /api/auth/login` - Iniciar sesion
- `GET /api/auth/me` - Obtener usuario autenticado
- `POST /api/auth/logout` - Cerrar sesion

### Cruces Semaforizados
- `GET /api/cruces` - Listar cruces (paginacion, filtros, ordenamiento)
- `GET /api/cruces/:id` - Obtener detalle de cruce
- `POST /api/cruces` - Crear nuevo cruce
- `PATCH /api/cruces/:id` - Actualizar cruce
- `DELETE /api/cruces/:id` - Eliminar cruce
- `GET /api/cruces/:id/perifericos` - Listar perifericos del cruce
- `POST /api/cruces/:id/perifericos` - Asociar periferico existente
- `GET /api/cruces/catalog` - Catalogo simplificado para autocomplete

### Perifericos
- `GET /api/perifericos` - Listar perifericos
- `GET /api/perifericos/:id` - Detalle de periferico
- `POST /api/perifericos` - Crear nuevo periferico
- `PATCH /api/perifericos/:id` - Actualizar periferico
- `DELETE /api/perifericos/:id` - Eliminar periferico

### Incidencias
- `GET /api/incidents` - Listar incidencias (paginado, filtros)
- `GET /api/incidents/:id` - Detalle de incidencia
- `POST /api/incidents` - Crear incidencia
- `PATCH /api/incidents/:id` - Actualizar incidencia
- `DELETE /api/incidents/:id` - Eliminar incidencia
- `GET /api/incidents/:id/tracking` - Obtener seguimientos
- `POST /api/incidents/:id/tracking` - Agregar seguimiento
- `GET /api/incidents/cruces-apagados/count` - Contador de cruces apagados

### Notificaciones
- `GET /api/notifications` - Listar notificaciones (paginado)
- `GET /api/notifications/unread-count` - Contador de no leidas
- `PATCH /api/notifications/:id/mark-read` - Marcar como leida
- `PATCH /api/notifications/mark-all-read` - Marcar todas como leidas
- `WebSocket /` - Conexion en tiempo real para notificaciones

### Catalogos
- `GET /api/tipos` - Tipos jerarquicos (cruces, perifericos, incidencias)
- `GET /api/ubigeos` - Division geografica (departamento, provincia, distrito)
- `GET /api/administradores` - Entidades administradoras
- `GET /api/ejes` - Vias y avenidas principales
- `GET /api/incidents/catalogs/estados` - Estados de incidencias
- `GET /api/incidents/catalogs/equipos` - Equipos tecnicos

### Usuarios
- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Detalle de usuario
- `POST /api/users` - Crear usuario
- `PATCH /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

Documentacion completa disponible en: `http://localhost:3001/api/docs` (Swagger UI)

## Funcionalidades Destacadas

### Mapas con Priorizacion Visual
Los marcadores en los mapas utilizan codigo de colores para identificacion visual rapida:

**Mapa de Cruces:**
- Colores diferenciados por administrador (8 colores distintos)
- Iconos tipo pin con semaforo interno
- Filtros por tipo de gestion, comunicacion y administrador

**Mapa de Incidencias:**
- Rojo: Prioridad Alta
- Naranja: Prioridad Media
- Verde: Prioridad Baja

### Conversion Automatica a Mayusculas
Todos los campos de texto se convierten automaticamente a mayusculas para mantener consistencia en la base de datos.

### Herencia de Coordenadas
Las incidencias heredan automaticamente las coordenadas geograficas del cruce seleccionado, eliminando la necesidad de captura manual de ubicacion.

### Sistema de Seguimientos con Timeline
Cada incidencia mantiene un historial completo de seguimientos con:
- Cambios de estado con timestamps
- Asignacion de equipos y responsables
- Reportes detallados de intervenciones
- Usuario que registra cada accion
- Visualizacion tipo timeline

### Validaciones de Negocio
- Prevencion de seguimientos en incidencias finalizadas
- Actualizacion automatica de estado al crear seguimiento
- Validacion exhaustiva de campos requeridos
- Restriccion de edicion de ubicacion geografica heredada

### Gestion de Perifericos con Seguridad
- Formulario completo para creacion de perifericos
- Asociacion multiple periferico-cruce
- Visualizacion simplificada en listas (solo tipo)
- Modal de detalle con todos los campos
- Sistema de mostrar/ocultar passwords
- Exclusion del campo IP (tipo CIDR PostgreSQL no soportado en formularios)

## Tecnologias y Librerias

### Backend
- @nestjs/core 10.4.4
- @nestjs/common
- @nestjs/jwt
- @nestjs/passport
- @nestjs/websockets
- @nestjs/platform-socket.io
- @prisma/client 5.14.0
- socket.io 4.6.0
- passport-jwt
- bcryptjs
- class-validator
- class-transformer
- multer

### Frontend
- react 18.3.1
- react-dom 18.3.1
- react-router-dom 6.23.1
- typescript 5.5.3
- zustand 4.5.2
- socket.io-client 4.6.0
- leaflet 1.9.4
- react-leaflet
- bootstrap 5.3.8
- chart.js 4.5.1
- react-chartjs-2 5.3.1
- jspdf 3.0.4
- jspdf-autotable 5.0.2
- axios 1.7.2

### Herramientas de Desarrollo
- vite 5.3.1
- @vitejs/plugin-react
- prisma 5.14.0
- @types/react
- @types/leaflet
- eslint
- typescript-eslint

## Seguridad

- Autenticacion mediante tokens JWT con expiracion configurable
- Hash seguro de passwords usando bcryptjs (salt rounds: 10)
- Validacion exhaustiva de datos en backend con class-validator
- Control de acceso basado en roles (RBAC)
- Proteccion de rutas en frontend mediante guards
- Sanitizacion de inputs en formularios
- CORS configurado para origenes permitidos
- Headers de seguridad HTTP
- Proteccion contra inyeccion SQL mediante Prisma ORM

## Contribucion

Este es un proyecto privado. Para contribuir, contactar al autor.

## Licencia

Todos los derechos reservados - Aland Laines Calonge

## Soporte

Para consultas tecnicas o reporte de problemas, contactar al desarrollador.

---

Desarrollado con profesionalismo y atencion al detalle por Aland Laines Calonge

