# Frontend - React + Vite + TypeScript

Aplicación web para el Sistema de Gestión de Incidencias de Semáforos.

## Tecnologías

- **Framework**: React 18.x
- **Build Tool**: Vite 5.x
- **Lenguaje**: TypeScript
- **Estado**: Zustand
- **Routing**: React Router v6
- **Formularios**: React Hook Form + Zod
- **UI**: TailwindCSS
- **Mapas**: Leaflet + React-Leaflet
- **HTTP Client**: Axios
- **WebSockets**: Socket.io-client

## Estructura

```
src/
├── main.tsx               # Punto de entrada
├── App.tsx                # Componente raíz
├── features/              # Módulos por funcionalidad
│   ├── auth/             # Autenticación
│   ├── incidents/        # Gestión de incidencias
│   ├── dashboard/        # Dashboard
│   ├── maps/             # Mapas con Leaflet
│   ├── traffic-lights/   # Semáforos
│   ├── assignments/      # Asignaciones
│   ├── reports/          # Reportes
│   ├── notifications/    # Notificaciones
│   └── users/            # Gestión de usuarios
├── shared/               # Componentes compartidos
│   ├── components/       # Componentes UI
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utilidades
│   └── constants/        # Constantes
├── core/                 # Servicios core
│   ├── api/             # Cliente API
│   ├── websocket/       # Cliente WebSocket
│   ├── router/          # Configuración de rutas
│   └── store/           # Store global
├── layouts/             # Layouts
└── styles/              # Estilos globales
```

## Scripts

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview de build
npm run preview

# Linting
npm run lint

# Format
npm run format
```

## Variables de Entorno

Ver `.env.example` en la raíz del proyecto.

## Rutas Principales

- `/` - Dashboard
- `/login` - Login
- `/incidents` - Lista de incidencias
- `/incidents/new` - Nueva incidencia
- `/incidents/:id` - Detalle de incidencia
- `/map` - Vista de mapa
- `/traffic-lights` - Semáforos
- `/reports` - Reportes
- `/users` - Gestión de usuarios (solo admin)

## Características

- Autenticación JWT + Google OAuth
- Notificaciones en tiempo real (WebSockets)
- Mapas interactivos con Leaflet
- Responsive design
- Dark mode ready
- Validación de formularios
- Gestión de estado reactivo
