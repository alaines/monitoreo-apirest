# Product Backlog - Sistema de Gestión de Incidencias de Semáforos

## 🎯 Visión del Producto

Sistema moderno de gestión de incidencias para el monitoreo y mantenimiento de semáforos urbanos, con capacidad de integración con múltiples fuentes de reporte (Waze, WhatsApp, llamadas, personal de campo) y notificaciones en tiempo real.

---

## 📊 Épicas Principales

### 1. **Autenticación y Gestión de Usuarios** 
- Sistema de autenticación JWT
- Login con Google OAuth (opcional)
- Gestión de usuarios por roles (PUBLICO, OPERADOR, SUPERVISOR, ADMINISTRADOR)
- Control de permisos RBAC

### 2. **Gestión de Incidencias (Core)**
- Registro de tickets/incidencias
- Seguimiento de estados
- Asignación a equipos de mantenimiento
- Sistema de prioridades
- Múltiples fuentes de reporte

### 3. **Gestión de Semáforos e Intersecciones**
- Catálogo de intersecciones
- Datos geoespaciales (PostGIS)
- Inventario de semáforos y equipos
- Historial de mantenimiento

### 4. **Visualización en Mapas**
- Mapa interactivo con Leaflet
- Marcadores de incidencias
- Marcadores de semáforos
- Filtros y capas

### 5. **Reportes y Estadísticas**
- Reportes por fecha
- Reportes por estado
- Reportes por equipo
- Exportación a Excel
- Dashboard con métricas

### 6. **Integraciones Externas**
- Waze for Cities (alertas)
- WhatsApp Business API
- Sistema de notificaciones

### 7. **Tiempo Real y Notificaciones**
- WebSockets para actualizaciones
- Notificaciones push
- Estado online de operadores

---

## 📋 Backlog Priorizado

### Prioridad ALTA (Must Have - Sprint 0-3)

| ID | Historia de Usuario | Estimación | Sprint | Notas |
|----|-------------------|------------|--------|-------|
| US-001 | Como operador, necesito autenticarme con usuario y contraseña | 5 | 1 | Core - Autenticación |
| US-002 | Como administrador, necesito crear y gestionar usuarios | 8 | 1 | CRUD básico |
| US-003 | Como operador, necesito registrar una nueva incidencia | 13 | 2 | Core funcionalidad |
| US-004 | Como operador, necesito ver la lista de incidencias pendientes | 8 | 2 | Lista con filtros |
| US-005 | Como operador, necesito asignar una incidencia a un equipo | 5 | 2 | Asignación básica |
| US-006 | Como operador, necesito registrar el seguimiento de una incidencia | 8 | 2 | Tracking |
| US-007 | Como supervisor, necesito ver incidencias en un mapa | 13 | 3 | Leaflet + PostGIS |
| US-008 | Como operador, necesito consultar el catálogo de semáforos | 5 | 3 | Lista básica |
| US-009 | Como operador, necesito ver el detalle completo de una incidencia | 5 | 2 | Vista detalle |
| US-010 | Como sistema, necesito migrar datos desde CakePHP a Prisma | 13 | 0 | Migración inicial |

### Prioridad MEDIA (Should Have - Sprint 4-6)

| ID | Historia de Usuario | Estimación | Sprint | Notas |
|----|-------------------|------------|--------|-------|
| US-011 | Como operador, necesito recibir notificaciones en tiempo real | 13 | 4 | WebSockets |
| US-012 | Como supervisor, necesito generar reportes por fecha | 8 | 4 | Reporte básico |
| US-013 | Como operador, necesito exportar reportes a Excel | 5 | 4 | Exportación |
| US-014 | Como usuario, necesito iniciar sesión con Google | 8 | 5 | OAuth Google |
| US-015 | Como sistema, necesito integrar alertas de Waze | 13 | 5 | API Waze |
| US-016 | Como operador, necesito filtrar incidencias por múltiples criterios | 8 | 4 | Filtros avanzados |
| US-017 | Como administrador, necesito ver dashboard con estadísticas | 13 | 6 | Dashboard |
| US-018 | Como supervisor, necesito ver historial de cambios (auditoría) | 8 | 6 | Auditoría |

### Prioridad BAJA (Nice to Have - Sprint 7+)

| ID | Historia de Usuario | Estimación | Sprint | Notas |
|----|-------------------|------------|--------|-------|
| US-019 | Como sistema, necesito integración con WhatsApp | 21 | 7 | WhatsApp API |
| US-020 | Como técnico, necesito una app móvil para reportar desde campo | 34 | 8-9 | React Native |
| US-021 | Como operador, necesito sistema de notificaciones push | 13 | 7 | Push notifications |
| US-022 | Como supervisor, necesito reportes gráficos avanzados | 13 | 7 | Charts |
| US-023 | Como operador, necesito adjuntar fotos a las incidencias | 8 | 7 | Upload files |

---

## 🎯 Criterios de Aceptación Generales

### Funcionales
- ✅ Todas las operaciones CRUD funcionan correctamente
- ✅ Validaciones en frontend y backend
- ✅ Mensajes de error claros y traducidos al español
- ✅ Respuestas API siguen estándar REST
- ✅ Datos persistidos correctamente en PostgreSQL

### No Funcionales
- ✅ Tiempo de respuesta < 2 segundos
- ✅ UI responsive (móvil, tablet, desktop)
- ✅ Accesibilidad básica (WCAG 2.0 nivel A)
- ✅ Código con cobertura de tests > 70%
- ✅ Sin errores en consola

### Seguridad
- ✅ Autenticación requerida para todas las rutas (excepto login)
- ✅ Autorización por roles
- ✅ Validación de inputs (XSS, SQL Injection)
- ✅ Passwords encriptados (bcrypt)
- ✅ Tokens JWT seguros

---

## 📈 Estimación Total

- **Total Story Points**: ~220 puntos
- **Velocidad estimada**: 25-30 puntos por sprint (2 semanas)
- **Duración estimada**: 7-9 sprints (14-18 semanas)

---

## 🏃‍♂️ Definición de Done (DoD)

Para que una historia se considere completa debe cumplir:

1. ✅ Código implementado y testeado
2. ✅ Tests unitarios pasando (cobertura > 70%)
3. ✅ Code review aprobado
4. ✅ Documentación actualizada
5. ✅ Integrado en rama develop sin conflictos
6. ✅ Validado por Product Owner
7. ✅ Sin bugs críticos pendientes
8. ✅ Cumple criterios de aceptación

---

## 📝 Notas

- Los Story Points usan escala Fibonacci (1, 2, 3, 5, 8, 13, 21, 34)
- Sprints de 2 semanas
- Revisión y retrospectiva al final de cada sprint
- Planning meeting al inicio de cada sprint
