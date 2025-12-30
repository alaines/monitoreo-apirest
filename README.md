# Sistema de Monitoreo de Incidencias

Sistema integral de gestión y monitoreo de incidencias de tráfico en tiempo real. Monorepo fullstack desarrollado con NestJS, React, PostgreSQL y PostGIS.

## Descripción

Aplicación web para la gestión, seguimiento y análisis de incidencias de tráfico y semáforos en la ciudad. Permite el registro de reportes ciudadanos, asignación de equipos técnicos, seguimiento del ciclo de vida de las incidencias, y visualización en tiempo real mediante mapas interactivos con priorización por nivel de urgencia.

## Características Principales

### Gestión de Incidencias
- Registro y catalogación de incidencias de tráfico
- Sistema de prioridades (Alta, Media, Baja)
- Asignación automática a equipos técnicos
- Seguimiento del ciclo de vida (Asignado, En Proceso, Resuelto, Cancelado, Reasignado)
- Heredamiento de coordenadas geográficas desde cruces semaforizados
- Cálculo automático de días sin atención

### Dashboard Analítico
- Visualización de estadísticas en tiempo real
- Filtros por período (Hoy, Semana, Mes, Año, Todas)
- Indicadores de incidencias activas, pendientes, en progreso y tiempo promedio de resolución
- Mapa interactivo con múltiples capas (OpenStreetMap, Satélite, Topográfico)
- Marcadores con código de colores según prioridad
- Información contextual en popups (tipo, cruce, ticket, días sin atención)

### Sistema de Seguimiento
- Timeline visual de seguimientos por incidencia
- Registro de estados, equipos asignados y responsables
- Reportes detallados con timestamps
- Restricción de modificaciones en incidencias finalizadas
- Historial completo de cambios

### Autenticación y Permisos
- Sistema de autenticación JWT
- Roles de usuario (Administrador, Supervisor, Operador)
- Control de acceso basado en roles
- Gestión de usuarios con interfaz administrativa

### Interfaz de Usuario
- Diseño responsive con Bootstrap 5
- Sidebar lateral colapsable
- Formularios con validación y conversión automática a mayúsculas
- Autocomplete para búsqueda de cruces
- Filtros avanzados con ordenamiento y paginación
- Modales para visualización de detalles

## Arquitectura Técnica

### Backend
- Framework: NestJS 10.x
- ORM: Prisma
- Base de Datos: PostgreSQL 13+ con extensión PostGIS
- Autenticación: JWT (Passport.js)
- Documentación: Swagger/OpenAPI
- Validación: class-validator + class-transformer

### Frontend
- Framework: React 18.x
- Build Tool: Vite
- Lenguaje: TypeScript
- UI Framework: Bootstrap 5.3.8
- Gestión de Estado: Zustand
- Mapas: Leaflet + React Leaflet
- Enrutamiento: React Router v6

### Base de Datos
- Motor: PostgreSQL 13+
- Extensión Espacial: PostGIS
- Esquema: Normalizado con relaciones FK
- Funcionalidad Geoespacial: Coordenadas geográficas, geometrías

## Requisitos del Sistema

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL 13+ con PostGIS
- Git

## Instalación

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

Crear archivo `.env` en la raíz del proyecto:

```env
# Base de Datos
DATABASE_HOST=192.168.18.230
DATABASE_PORT=5432
DATABASE_USER=transito
DATABASE_PASSWORD=transito
DATABASE_NAME=monitoreo

# Backend
PORT=3001
JWT_SECRET=your-secret-key-here
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3001/api
```

### 4. Generar Prisma Client

```bash
cd apps/backend
npx prisma generate
```

### 5. Iniciar la aplicación

```bash
# Desde la raíz del proyecto

# Backend (puerto 3001)
npm run backend:dev

# Frontend (puerto 5173)
npm run frontend:dev
```

## Estructura del Proyecto

```
monitoreo-apirest/
├── apps/
│   ├── backend/                 # API REST NestJS
│   │   ├── src/
│   │   │   ├── auth/           # Autenticación JWT
│   │   │   ├── users/          # Gestión de usuarios
│   │   │   ├── incidents/      # Gestión de incidencias
│   │   │   ├── cruces/         # Catálogo de cruces
│   │   │   └── prisma/         # Servicio Prisma
│   │   └── prisma/
│   │       └── schema.prisma   # Esquema de base de datos
│   │
│   └── frontend/                # Aplicación React
│       ├── src/
│       │   ├── components/     # Componentes reutilizables
│       │   ├── features/       # Funcionalidades por módulo
│       │   │   ├── auth/       # Login y gestión de sesión
│       │   │   ├── incidents/  # Listado, detalle, formularios
│       │   │   └── users/      # Administración de usuarios
│       │   ├── pages/          # Páginas principales
│       │   ├── services/       # Clientes API
│       │   └── lib/            # Utilidades y configuración
│       │
├── database/                    # Scripts SQL y migraciones
└── docs/                        # Documentación del proyecto
```

## Scripts Disponibles

### Backend
```bash
npm run backend:dev          # Desarrollo con hot-reload
npm run backend:build        # Build para producción
npm run backend:start        # Ejecutar build de producción
npx prisma studio            # Abrir Prisma Studio
```

### Frontend
```bash
npm run frontend:dev         # Desarrollo con Vite
npm run frontend:build       # Build optimizado
npm run frontend:preview     # Preview del build
```

## Endpoints Principales

### Autenticación
- POST `/api/auth/login` - Inicio de sesión
- GET `/api/auth/profile` - Perfil del usuario autenticado

### Incidencias
- GET `/api/incidents` - Listar incidencias (paginado, filtros, ordenamiento)
- GET `/api/incidents/:id` - Detalle de incidencia
- POST `/api/incidents` - Crear incidencia
- PATCH `/api/incidents/:id` - Actualizar incidencia
- DELETE `/api/incidents/:id` - Eliminar incidencia
- GET `/api/incidents/:id/trackings` - Seguimientos de incidencia
- POST `/api/incidents/:id/trackings` - Crear seguimiento

### Catálogos
- GET `/api/incidents/catalogs/tipos` - Tipos de incidencia
- GET `/api/incidents/catalogs/estados` - Estados
- GET `/api/incidents/catalogs/equipos` - Equipos técnicos
- GET `/api/cruces/catalog` - Cruces semaforizados

### Usuarios
- GET `/api/users` - Listar usuarios
- POST `/api/users` - Crear usuario
- PATCH `/api/users/:id` - Actualizar usuario
- DELETE `/api/users/:id` - Eliminar usuario

Documentación completa disponible en: http://localhost:3001/api/docs

## Funcionalidades Destacadas

### Mapas con Priorización
Los marcadores en el mapa utilizan código de colores para identificación visual rápida:
- Rojo: Prioridad Alta
- Naranja: Prioridad Media
- Verde: Prioridad Baja

### Conversión Automática a Mayúsculas
Todos los campos de texto se convierten automáticamente a mayúsculas para mantener consistencia en los datos.

### Herencia de Coordenadas
Las incidencias heredan automáticamente las coordenadas geográficas del cruce seleccionado, eliminando la necesidad de captura manual.

### Sistema de Seguimientos
Cada incidencia mantiene un historial completo de seguimientos con:
- Cambios de estado
- Asignación de equipos y responsables
- Reportes detallados
- Timestamps automáticos
- Usuario que registra cada acción

### Validaciones de Negocio
- Prevención de seguimientos en incidencias finalizadas
- Actualización automática de estado de incidencia al crear seguimiento
- Validación de campos requeridos
- Restricción de edición de ubicación geográfica

## Tecnologías Utilizadas

**Backend:**
- NestJS 10.4.4
- Prisma 5.14.0
- PostgreSQL + PostGIS
- Passport JWT
- class-validator
- Swagger

**Frontend:**
- React 18.3.1
- TypeScript 5.5.3
- Vite 5.3.1
- Bootstrap 5.3.8
- Leaflet 1.9.4
- React Router 6.23.1
- Zustand 4.5.2
- Axios 1.7.2

## Licencia

MIT License

## Autor

Aland Laines Calonge

