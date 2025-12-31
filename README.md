# Sistema de Monitoreo de Semaforos e Incidencias

Sistema integral de gestion y monitoreo de cruces semaforizados e incidencias de trafico en tiempo real. Monorepo fullstack desarrollado con NestJS, React, PostgreSQL y PostGIS.

## Autor

Aland Laines Calonge

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
- Calculo automatico de dias sin atencion
- Sistema de tracking con timeline visual y historial completo
- Restriccion de modificaciones en incidencias finalizadas

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
- Integracion con mapas para analisis espacial

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
- Documentacion API: Swagger/OpenAPI
- Validacion: class-validator y class-transformer
- Gestion de Archivos: Multer con almacenamiento en disco

### Frontend
- Framework: React 18.x con hooks
- Herramienta de Build: Vite
- Lenguaje: TypeScript con tipado estricto
- UI Framework: Bootstrap 5.3.8
- Gestion de Estado: Zustand para estado global
- Mapas: Leaflet con React Leaflet
- Enrutamiento: React Router v6
- Generacion PDF: jsPDF con autotable
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
- @prisma/client 5.14.0
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
- leaflet 1.9.4
- react-leaflet
- bootstrap 5.3.8
- jspdf
- jspdf-autotable
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

Todos los derechos reservados - Alexander Laines

## Soporte

Para consultas tecnicas o reporte de problemas, contactar al desarrollador.

---

Desarrollado con profesionalismo y atencion al detalle por Alexander Laines

