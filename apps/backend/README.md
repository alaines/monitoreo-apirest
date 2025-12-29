# Backend - NestJS API REST

API REST para el Sistema de Gestión de Incidencias de Semáforos.

## Tecnologías

- **Framework**: NestJS 10.x
- **ORM**: Prisma 5.x
- **Base de Datos**: PostgreSQL 13+ con PostGIS
- **Autenticación**: JWT + Passport
- **WebSockets**: Socket.io
- **Documentación**: Swagger/OpenAPI
- **Validación**: class-validator

## Estructura

```
src/
├── main.ts                 # Punto de entrada
├── app.module.ts           # Módulo raíz
├── core/                   # Configuración y servicios core
│   ├── config/            # Configuraciones
│   ├── database/          # Prisma setup
│   ├── guards/            # Guards de autenticación
│   ├── interceptors/      # Interceptors globales
│   ├── filters/           # Exception filters
│   └── decorators/        # Decoradores personalizados
├── modules/               # Módulos de negocio
│   ├── auth/             # Autenticación y autorización
│   ├── users/            # Gestión de usuarios
│   ├── incidents/        # Core - Incidencias
│   ├── traffic-lights/   # Semáforos e intersecciones
│   ├── assignments/      # Asignaciones de trabajo
│   ├── reports/          # Reportes
│   ├── notifications/    # Notificaciones
│   ├── whatsapp/         # Integración WhatsApp
│   ├── waze/             # Integración Waze
│   └── geolocation/      # Servicios geoespaciales
├── websockets/           # WebSocket gateways
└── shared/               # Utilidades compartidas
```

## Scripts

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm run start:prod

# Prisma
npm run prisma:generate    # Generar cliente Prisma
npm run prisma:migrate     # Ejecutar migraciones
npm run prisma:studio      # Abrir Prisma Studio

# Tests
npm run test
npm run test:e2e
npm run test:cov
```

## Variables de Entorno

Ver `.env.example` en la raíz del proyecto.

## Endpoints Principales

- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Login con Google
- `GET /api/incidents` - Listar incidencias
- `POST /api/incidents` - Crear incidencia
- `GET /api/traffic-lights` - Listar semáforos
- `GET /api/reports` - Generar reportes

## Documentación API

Una vez iniciado el servidor, la documentación Swagger estará disponible en:
- http://localhost:3000/api/docs
