# Monitoreo API REST

[![CI Pipeline](https://github.com/YOUR_USERNAME/monitoreo-apirest/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/monitoreo-apirest/actions/workflows/ci.yml)
[![CD Pipeline](https://github.com/YOUR_USERNAME/monitoreo-apirest/actions/workflows/cd.yml/badge.svg)](https://github.com/YOUR_USERNAME/monitoreo-apirest/actions/workflows/cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

Sistema de Gestión de Incidencias de Semáforos - Monorepo con NestJS + React + PostgreSQL + Prisma.

## ✅ Estado Actual

🎉 **Sprint 1 - Autenticación y Gestión de Usuarios: COMPLETADO 100%**

**Backend API**: http://192.168.18.230:3001/api  
**Swagger Docs**: http://192.168.18.230:3001/api/docs  
**Estado**: ✅ Funcional y probado

### Funcionalidades Implementadas
- ✅ Sistema de autenticación JWT completo
- ✅ Login con usuario/contraseña
- ✅ Gestión de usuarios con roles (ADMIN, OPERADOR, SUPERVISOR)
- ✅ Endpoints protegidos con guards JWT
- ✅ CRUD completo de usuarios
- ✅ Documentación Swagger generada
- ✅ Tests unitarios y E2E

Ver documentación completa en [docs/sprint-1-COMPLETADO.md](docs/sprint-1-COMPLETADO.md)

---

## 🏗️ Arquitectura

- **Backend**: NestJS 10.x con Prisma ORM
- **Frontend**: React 18.x con Vite y TypeScript
- **Base de Datos**: PostgreSQL 13+ con PostGIS
- **Mapas**: Leaflet + OpenStreetMap
- **WebSockets**: Socket.io para actualizaciones en tiempo real
- **Monorepo**: npm workspaces

## 📋 Requisitos Previos

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL 13+ con PostGIS (o Docker)
- Git

## 🚀 Inicio Rápido

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd monitoreo-apirest
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Configurar base de datos

#### Opción A: Usar Docker

```bash
npm run docker:up
```

#### Opción B: PostgreSQL existente

```bash
# Asegúrate de que PostgreSQL esté corriendo
# Actualiza DATABASE_URL en .env

# Generar Prisma Client
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate
```

### 5. Iniciar aplicaciones

```bash
# Desarrollo (backend + frontend)
npm run dev

# Solo backend
npm run backend:dev

# Solo frontend
npm run frontend:dev
```

## 📁 Estructura del Proyecto

```
monitoreo-apirest/
├── apps/
│   ├── backend/          # API REST con NestJS
│   └── frontend/         # Aplicación React
├── packages/
│   ├── shared-types/     # Types compartidos
│   └── shared-utils/     # Utilidades compartidas
├── database/
│   ├── current-schema.sql    # Esquema actual
│   └── README.md
├── docker/              # Configuraciones Docker
├── docs/                # Documentación
└── scripts/             # Scripts de utilidad
```

## 🛠️ Scripts Disponibles

### General

- `npm run dev` - Iniciar todo en modo desarrollo
- `npm run build` - Build de todas las apps
- `npm run lint` - Linting de todo el proyecto
- `npm run format` - Formatear código

### Backend

- `npm run backend:dev` - Desarrollo
- `npm run backend:build` - Build
- `npm run backend:start` - Producción
- `npm run prisma:generate` - Generar Prisma Client
- `npm run prisma:migrate` - Ejecutar migraciones
- `npm run prisma:studio` - Abrir Prisma Studio

### Frontend

- `npm run frontend:dev` - Desarrollo
- `npm run frontend:build` - Build
- `npm run frontend:preview` - Preview de build

### Docker

- `npm run docker:up` - Levantar contenedores
- `npm run docker:down` - Detener contenedores
- `npm run docker:logs` - Ver logs

## 🔑 Variables de Entorno

Ver `.env.example` para la lista completa de variables requeridas.

Principales:
- `DATABASE_URL` - URL de conexión a PostgreSQL
- `JWT_SECRET` - Secret para JWT
- `PORT` - Puerto del backend (default: 3000)
- `FRONTEND_URL` - URL del frontend (default: http://localhost:5173)

## 📚 Documentación

- [Backend README](apps/backend/README.md)
- [Frontend README](apps/frontend/README.md)
- [Base de Datos](database/README.md)
- [Planificación de Sprints](docs/sprints/)

## 🎯 Características Principales

- ✅ Autenticación JWT + Google OAuth
- ✅ Gestión de incidencias de semáforos
- ✅ Notificaciones en tiempo real (WebSockets)
- ✅ Mapas interactivos con Leaflet
- ✅ Integración con Waze for Cities
- ✅ Integración con WhatsApp
- ✅ Sistema de roles (Público, Operador, Supervisor, Administrador)
- ✅ Reportes y estadísticas
- ✅ Auditoría de cambios
- ✅ Soporte PostGIS para datos geoespaciales

## 🧪 Testing

```bash
# Backend tests
npm run test -w apps/backend

# Frontend tests
npm run test -w apps/frontend

# E2E tests
npm run test:e2e -w apps/backend
```

## 📦 Despliegue

Ver `docker-compose.yml` para configuración de producción.

```bash
# Build para producción
npm run build

# Desplegar con Docker
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### CI/CD Pipeline

El proyecto utiliza GitHub Actions para integración y despliegue continuo:

- **CI Pipeline** (`.github/workflows/ci.yml`):
  - ✅ Lint con Prettier y ESLint
  - ✅ Tests unitarios (Jest)
  - ✅ Tests E2E con base de datos PostgreSQL
  - ✅ Build de frontend y backend
  - ✅ Security audit

- **CD Pipeline** (`.github/workflows/cd.yml`):
  - 🚀 Deploy automático a staging en push a `main`
  - 🚀 Deploy a producción en tags `v*`

**Variables de entorno requeridas en GitHub Secrets:**
```
JWT_SECRET              # Secret para firma JWT
STAGING_API_URL         # URL del API en staging
PROD_API_URL            # URL del API en producción
PROD_DATABASE_URL       # Connection string de producción
```

## 📝 Licencia

MIT

## 👥 Equipo

EMC-GMU - Gestión Municipal Urbana
