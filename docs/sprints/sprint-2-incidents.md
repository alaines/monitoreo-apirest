# Sprint 2 - Gestión de Incidencias (Core)

**Duración**: 2 semanas  
**Objetivo**: Implementar el núcleo funcional del sistema - gestión de incidencias/tickets

---

## Objetivo del Sprint

Desarrollar el módulo principal de incidencias permitiendo el registro, visualización, asignación y seguimiento de tickets reportados por operadores.

---

## Historias del Sprint

| ID | Historia | Story Points | Prioridad | Estado |
|----|----------|--------------|-----------|--------|
| US-003 | Como operador, necesito registrar una nueva incidencia | 13 | ALTA | To Do |
| US-004 | Como operador, necesito ver la lista de incidencias pendientes | 8 | ALTA | To Do |
| US-005 | Como operador, necesito asignar una incidencia a un equipo | 5 | ALTA | To Do |
| US-006 | Como operador, necesito registrar el seguimiento de una incidencia | 8 | ALTA | To Do |
| US-009 | Como operador, necesito ver el detalle completo de una incidencia | 5 | ALTA | To Do |

**Total Story Points**: 39

---

## Tareas Detalladas

### Backend (NestJS)

#### Módulo Incidents
- [ ] Crear módulo de incidencias
- [ ] Endpoint GET /api/incidents (lista con filtros y paginación)
- [ ] Endpoint GET /api/incidents/:id (detalle completo)
- [ ] Endpoint POST /api/incidents (crear incidencia)
- [ ] Endpoint PUT /api/incidents/:id (actualizar)
- [ ] Endpoint DELETE /api/incidents/:id (soft delete)
- [ ] Endpoint GET /api/incidents/stats (estadísticas básicas)

#### DTOs
- [ ] CreateIncidentDto
- [ ] UpdateIncidentDto
- [ ] FilterIncidentDto
- [ ] IncidentResponseDto

#### Entidades relacionadas
- [ ] IncidentType (tipos jerárquicos)
- [ ] Priority (prioridades)
- [ ] Status (estados)
- [ ] Reporter (fuentes de reporte)
- [ ] Team (equipos)

#### Servicios
- [ ] IncidentsService (CRUD principal)
- [ ] IncidentTypesService
- [ ] PrioritiesService
- [ ] StatusService
- [ ] TeamsService

#### Módulo Assignments (Asignaciones)
- [ ] Endpoint PUT /api/incidents/:id/assign
- [ ] Endpoint GET /api/teams
- [ ] Lógica de asignación
- [ ] Validaciones de asignación

#### Módulo Tracking (Seguimientos)
- [ ] Endpoint GET /api/incidents/:id/trackings
- [ ] Endpoint POST /api/incidents/:id/trackings
- [ ] IncidentTracking entity
- [ ] TrackingService

#### Base de Datos
- [ ] Verificar schema Prisma de incidencias
- [ ] Seed de tipos de incidencias
- [ ] Seed de prioridades
- [ ] Seed de estados
- [ ] Seed de equipos de prueba
- [ ] Seed de reportadores

#### Tests
- [ ] Tests unitarios IncidentsService
- [ ] Tests e2e CRUD incidencias
- [ ] Tests e2e asignación
- [ ] Tests e2e seguimientos

---

### Frontend (React)

#### Feature Incidents
```
features/incidents/
├── components/
│   ├── IncidentForm.tsx          # Formulario crear/editar
│   ├── IncidentList.tsx          # Lista de incidencias
│   ├── IncidentDetail.tsx        # Vista detalle
│   ├── IncidentFilters.tsx       # Filtros avanzados
│   ├── IncidentCard.tsx          # Card de incidencia
│   ├── StatusBadge.tsx           # Badge de estado
│   ├── PriorityBadge.tsx         # Badge de prioridad
│   └── TrackingTimeline.tsx      # Timeline de seguimientos
├── hooks/
│   ├── useIncidents.ts           # Hook principal
│   ├── useIncidentDetail.ts
│   ├── useIncidentTracking.ts
│   └── useIncidentForm.ts
├── services/
│   └── incidents.service.ts      # API calls
├── store/
│   └── incidentsSlice.ts         # Zustand store
├── types/
│   └── incident.types.ts
└── pages/
    ├── IncidentsListPage.tsx
    ├── NewIncidentPage.tsx
    └── IncidentDetailPage.tsx
```

#### Tareas Frontend
- [ ] Crear estructura de carpetas
- [ ] IncidentsListPage con tabla
- [ ] Filtros por estado, prioridad, equipo, fecha
- [ ] Paginación
- [ ] NewIncidentPage con formulario
- [ ] Validación con React Hook Form + Zod
- [ ] IncidentDetailPage
- [ ] Timeline de seguimientos
- [ ] Modal de asignación
- [ ] Form de nuevo seguimiento
- [ ] incidentsService con axios
- [ ] incidentsStore con Zustand
- [ ] Custom hooks

---

## UI/UX

### 1. Lista de Incidencias
**Elementos:**
- Tabla con columnas: ID, Tipo, Prioridad, Estado, Cruce, Equipo, Fecha
- Filtros: Estado, Prioridad, Equipo, Rango de fechas
- Búsqueda por texto
- Paginación (10, 20, 50 items)
- Botón "Nueva Incidencia"
- Badges de colores para estado y prioridad
- Click en fila abre detalle

### 2. Formulario Nueva Incidencia
**Campos:**
- **Tipo de Incidencia** (select jerárquico)
- **Prioridad** (select)
- **Cruce/Intersección** (select con búsqueda)
- **Descripción** (textarea, requerido)
- **Fuente de Reporte** (select: Waze, Llamada, WhatsApp, Campo)
- **Reportador** (select)
- **Nombre del Reportador** (text, si no está en catálogo)
- **Dato de Contacto** (text, teléfono/email)
- **Equipo Asignado** (select, opcional)

**Botones:**
- Guardar
- Cancelar

### 3. Detalle de Incidencia
**Secciones:**

**Información General:**
- ID del Ticket
- Tipo de incidencia
- Estado (badge)
- Prioridad (badge)
- Fecha de creación
- Usuario que registró

**Ubicación:**
- Cruce/Intersección
- Mapa pequeño con marcador

**Reportador:**
- Fuente
- Nombre
- Contacto

**Asignación:**
- Equipo asignado
- Botón "Reasignar" (solo operador/supervisor)

**Timeline de Seguimientos:**
- Lista cronológica de seguimientos
- Usuario que registró
- Fecha y hora
- Reporte/descripción
- Estado después del seguimiento
- Botón "Agregar Seguimiento"

**Acciones:**
- Editar
- Cerrar incidencia
- Cancelar incidencia

---

## Criterios de Aceptación

### US-003: Registrar Nueva Incidencia
- [x] Operador puede acceder al formulario
- [x] Campos obligatorios: tipo, descripción
- [x] Selección de cruce es opcional
- [x] Puede elegir fuente de reporte
- [x] Sistema genera ID automático
- [x] Estado inicial es "PENDIENTE"
- [x] Se registra usuario que crea
- [x] Validación de campos
- [x] Mensaje de éxito al guardar
- [x] Redirección a lista o detalle

### US-004: Ver Lista de Incidencias
- [x] Muestra todas las incidencias pendientes y en proceso
- [x] Ordenadas por fecha descendente
- [x] Paginación funcional
- [x] Filtros funcionan correctamente
- [x] Búsqueda por texto funciona
- [x] Click en fila abre detalle
- [x] Badges de colores según estado/prioridad
- [x] Carga rápida (< 2 segundos)

### US-005: Asignar Incidencia
- [x] Solo operador o supervisor puede asignar
- [x] Modal de asignación muestra equipos disponibles
- [x] Puede reasignar si es necesario
- [x] Se registra usuario que asigna
- [x] Estado cambia automáticamente a "EN_PROCESO"
- [x] Notificación de asignación (opcional)

### US-006: Registrar Seguimiento
- [x] Usuario puede agregar seguimiento desde detalle
- [x] Campos: Reporte (textarea), Estado (opcional)
- [x] Se registra usuario y fecha automáticamente
- [x] Timeline se actualiza automáticamente
- [x] Validación de reporte (no vacío)

### US-009: Ver Detalle
- [x] Muestra toda la información completa
- [x] Timeline de seguimientos ordenado cronológicamente
- [x] Mapa con ubicación del cruce
- [x] Botones de acción según permisos
- [x] Carga rápida de datos

---

## Modelo de Datos

### Incident (Ticket)
```typescript
interface Incident {
  id: number;
  incidenciaId: number;          // FK a tipo
  prioridadId?: number;          // FK a prioridad
  cruceId?: number;              // FK a cruce
  equipoId?: number;             // FK a equipo
  descripcion: string;
  estadoId: number;              // FK a estado
  reportadorId?: number;         // FK a reportador
  reportadorNombres?: string;
  reportadorDatoContacto?: string;
  usuarioRegistra: string;
  usuarioFinaliza?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Configuración Técnica

### Enums
```typescript
enum IncidentSource {
  WAZE = 'WAZE',
  LLAMADA = 'LLAMADA',
  WHATSAPP = 'WHATSAPP',
  CAMPO = 'CAMPO',
}

enum IncidentStatus {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  RESUELTO = 'RESUELTO',
  CERRADO = 'CERRADO',
  CANCELADO = 'CANCELADO',
}
```

---

## Definition of Done

- [ ] CRUD completo de incidencias funcional
- [ ] Asignación de equipos funciona
- [ ] Seguimientos se registran correctamente
- [ ] Tests unitarios > 70% coverage
- [ ] Tests e2e principales pasando
- [ ] UI responsive
- [ ] Sin errores en consola
- [ ] Code review aprobado
- [ ] Documentación Swagger actualizada
- [ ] Demo funcional

---

## Demo

Demostrar:
1. Crear nueva incidencia desde formulario
2. Ver lista con filtros
3. Asignar incidencia a equipo
4. Agregar seguimiento
5. Ver detalle completo con timeline
6. Cambiar estado de incidencia

---

## Planificación

### Semana 1
- **Días 1-2**: Backend - CRUD incidencias
- **Días 3-4**: Backend - Asignaciones y seguimientos
- **Día 5**: Tests backend

### Semana 2
- **Días 1-2**: Frontend - Lista y filtros
- **Días 3-4**: Frontend - Formularios y detalle
- **Día 5**: Integración + Demo

---

## Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Complejidad de filtros | Medio | Empezar con filtros básicos |
| Validaciones complejas | Medio | Usar Zod para schemas |
| Timeline muy largo | Bajo | Paginación de seguimientos |

---

## Referencias

- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [Zustand State Management](https://github.com/pmndrs/zustand)
