# Product Backlog - Sistema de Monitoreo de Semaforos e Incidencias

## Vision del Producto

Sistema integral de gestion de cruces semaforizados, perifericos e incidencias para el monitoreo y mantenimiento de infraestructura vial urbana. Incluye capacidad de integracion con multiples fuentes de reporte y visualizacion geografica en tiempo real.

---

## Epicas Principales

### 1. Autenticacion y Gestion de Usuarios
- Sistema de autenticacion JWT
- Gestion de usuarios por roles (PUBLICO, OPERADOR, SUPERVISOR, ADMINISTRADOR)
- Control de permisos RBAC

### 2. Gestion de Cruces Semaforizados
- Catalogo completo de cruces
- Datos geoespaciales (PostGIS)
- Informacion tecnica y operacional
- Planos y documentacion tecnica
- Visualizacion en mapa interactivo

### 3. Inventario de Perifericos
- Gestion de dispositivos tecnicos (controladores, camaras, detectores)
- Asociacion multiple periferico-cruce
- Control de garantias y estados
- Configuracion de red y credenciales

### 4. Inventario de Estructuras
- Catalogacion de estructuras fisicas (postes, columnas, gabinetes)
- Asociacion estructura-cruce
- Control de altura, material, fabricante
- Estado y garantias de estructuras

### 5. Sistema de Reportes
- Reportes de incidencias por periodo
- Reportes de cruces por administrador
- Reportes de inventario de perifericos y estructuras
- Graficos estadisticos interactivos
- Exportacion a Excel y PDF con formato
- Analisis de desempeno de equipos tecnicos
- Reporte de garantias proximas a vencer

### 6. Modulo de Administracion
- Mantenimiento de catalogos (tabla tipos)
- Gestion avanzada de usuarios
- Creacion y gestion de perfiles
- Sistema de permisos granulares por modulo y accion
- Auditoria de cambios administrativos
- Configuracion general del sistema

### 7. Gestion de Incidencias (Core)
- Registro de tickets/incidencias
- Seguimiento de estados con timeline
- Asignacion a equipos de mantenimiento
- Sistema de prioridades
- Heredamiento de coordenadas desde cruces

### 8. Visualizacion en Mapas
- Mapa interactivo con Leaflet
- Mapa de cruces con filtros avanzados
- Mapa de incidencias con codigo de colores por prioridad
- Multiples capas (OpenStreetMap, Satelite, Topografico)

### 9. Dashboard Analitico
- Dashboard analitico con KPIs
- Filtros por periodo temporal
- Metricas de resolucion
- Visualizacion de incidencias activas en mapa

### 10. Integraciones Externas (Futuro)
- Sistema de notificaciones en tiempo real
- Integracion con fuentes externas

---

## Backlog Priorizado

### Prioridad ALTA (Must Have - Sprints 0-4)

| ID | Historia de Usuario | Estimacion | Sprint | Estado |
|----|-------------------|------------|--------|--------|
| US-001 | Como operador, necesito autenticarme con usuario y password | 5 | 1 | COMPLETADO |
| US-002 | Como administrador, necesito crear y gestionar usuarios | 8 | 1 | COMPLETADO |
| US-003 | Como operador, necesito registrar una nueva incidencia | 13 | 2 | COMPLETADO |
| US-004 | Como operador, necesito ver la lista de incidencias pendientes | 8 | 2 | COMPLETADO |
| US-005 | Como operador, necesito asignar una incidencia a un equipo | 5 | 2 | COMPLETADO |
| US-006 | Como operador, necesito registrar el seguimiento de una incidencia | 8 | 2 | COMPLETADO |
| US-007 | Como operador, necesito consultar el catalogo de cruces semaforizados | 5 | 4 | COMPLETADO |
| US-008 | Como operador, necesito ver el detalle completo de una incidencia | 5 | 2 | COMPLETADO |
| US-009 | Como administrador, necesito gestionar cruces semaforizados | 13 | 4 | COMPLETADO |
| US-010 | Como administrador, necesito gestionar perifericos de cruces | 13 | 4 | COMPLETADO |
| US-011 | Como usuario, necesito ver cruces en un mapa interactivo | 8 | 4 | COMPLETADO |
| US-012 | Como supervisor, necesito ver dashboard con estadisticas de incidencias | 13 | 3 | COMPLETADO |
| US-013 | Como usuario, necesito ver incidencias en un mapa con codigo de colores | 8 | 3 | COMPLETADO |

### Prioridad MEDIA (Should Have - Sprints 5-7)

| ID | Historia de Usuario | Estimacion | Sprint | Estado |
|----|-------------------|------------|--------|--------|
| US-014 | Como administrador, necesito gestionar inventario de estructuras | 21 | 5 | PLANIFICADO |
| US-015 | Como administrador, necesito asociar estructuras a cruces | 8 | 5 | PLANIFICADO |
| US-016 | Como supervisor, necesito generar reportes de incidencias por periodo | 13 | 6 | PLANIFICADO |
| US-017 | Como administrador, necesito reportes de cruces por administrador | 8 | 6 | PLANIFICADO |
| US-018 | Como administrador, necesito reportes de inventario de perifericos | 8 | 6 | PLANIFICADO |
| US-019 | Como supervisor, necesito ver graficos estadisticos de incidencias | 8 | 6 | PLANIFICADO |
| US-020 | Como usuario, necesito exportar reportes a Excel con formato | 5 | 6 | PLANIFICADO |
| US-021 | Como usuario, necesito exportar reportes a PDF con formato | 5 | 6 | PLANIFICADO |
| US-022 | Como supervisor, necesito analizar tiempos de atencion por equipo | 8 | 6 | PLANIFICADO |
| US-023 | Como administrador, necesito gestionar catalogos (tabla tipos) | 13 | 7 | COMPLETADO |
| US-024 | Como administrador, necesito gestion avanzada de usuarios | 13 | 7 | COMPLETADO |
| US-025 | Como administrador, necesito crear y gestionar perfiles de usuario | 13 | 7 | COMPLETADO |
| US-026 | Como administrador, necesito asignar permisos granulares por modulo | 13 | 7 | COMPLETADO |
| US-027 | Como sistema, necesito proteger rutas segun permisos del usuario | 8 | 7 | COMPLETADO |
| US-028 | Como administrador, necesito ver auditoria de cambios administrativos | 8 | 7 | COMPLETADO |
| US-029 | Como administrador, necesito gestionar tablas maestras (Areas, Equipos, etc) | 21 | 7 | COMPLETADO |
| US-029 | Como operador, necesito adjuntar fotos a las incidencias | 8 | 8 | PENDIENTE |
| US-030 | Como tecnico, necesito ver perifericos montados en estructuras | 13 | 8 | PENDIENTE |

### Prioridad BAJA (Nice to Have - Sprints 8+)

| ID | Historia de Usuario | Estimacion | Sprint | Estado |
|----|-------------------|------------|--------|--------|
| US-031 | Como operador, necesito recibir notificaciones en tiempo real | 13 | 8 | PENDIENTE |
| US-032 | Como administrador, necesito programar reportes automaticos | 13 | 8 | PENDIENTE |
| US-033 | Como sistema, necesito integracion con fuentes externas | 21 | 9 | PENDIENTE |
| US-034 | Como tecnico, necesito una app movil para reportar desde campo | 34 | 10+ | PENDIENTE |

---

## Criterios de Aceptacion Generales

### Funcionales
- Todas las operaciones CRUD funcionan correctamente
- Validaciones en frontend y backend
- Mensajes de error claros en espanol
- Respuestas API siguen estandar REST
- Datos persistidos correctamente en PostgreSQL
- Conversion automatica a mayusculas en campos de texto

### No Funcionales
- Tiempo de respuesta menor a 2 segundos
- UI responsive (movil, tablet, desktop)
- Codigo sin console.log en produccion
- Sin errores en consola del navegador
- Uso de TypeScript con tipado estricto

### Seguridad
- Autenticacion requerida para todas las rutas (excepto login)
- Autorizacion por roles
- Validacion de inputs (XSS, SQL Injection)
- Passwords encriptados (bcrypt)
- Tokens JWT seguros
- Credenciales protegidas con opcion de mostrar/ocultar

---

## Estimacion Total

- **Total Story Points (Completados)**: ~110 puntos
- **Total Story Points (Planificados - Sprints 5-7)**: ~140 puntos
- **Total Story Points (Pendientes)**: ~80 puntos
- **Velocidad promedio**: 25-30 puntos por sprint (2 semanas)
- **Duracion estimada restante**: 7-9 sprints

---

## Definicion de Done (DoD)

Para que una historia se considere completa debe cumplir:

1. Codigo implementado y funcional
2. Validaciones en frontend y backend
3. Documentacion actualizada (README, comentarios)
4. Sin errores en consola
5. Codigo limpio sin console.log
6. Cumple criterios de aceptacion
7. Probado manualmente en todos los flujos
8. Integrado en rama principal

---

## Notas
- Validaciones en frontend y backend
- Mensajes de error claros y traducidos al español
- Respuestas API siguen estándar REST
- Datos persistidos correctamente en PostgreSQL

### No Funcionales
- Tiempo de respuesta < 2 segundos
- UI responsive (móvil, tablet, desktop)
- Accesibilidad básica (WCAG 2.0 nivel A)
- Código con cobertura de tests > 70%
- Sin errores en consola

### Seguridad
- Autenticación requerida para todas las rutas (excepto login)
- Autorización por roles
- Validación de inputs (XSS, SQL Injection)
- Passwords encriptados (bcrypt)
- Tokens JWT seguros

---

## Estimación Total

- **Total Story Points**: ~220 puntos
- **Velocidad estimada**: 25-30 puntos por sprint (2 semanas)
- **Duración estimada**: 7-9 sprints (14-18 semanas)

---

## Definición de Done (DoD)

Para que una historia se considere completa debe cumplir:

1. Código implementado y testeado
2. Tests unitarios pasando (cobertura > 70%)
3. Code review aprobado
4. Documentación actualizada
5. Integrado en rama develop sin conflictos
6. Validado por Product Owner
7. Sin bugs críticos pendientes
8. Cumple criterios de aceptación

---

## Notas

- Los Story Points usan escala Fibonacci (1, 2, 3, 5, 8, 13, 21, 34)
- Sprints de 2 semanas
- Revision y retrospectiva al final de cada sprint

### Sprints Planificados
- **Sprint 5** - Inventario de Estructuras: tabla estructuras, cruces_estructuras, tipos de estructuras
- **Sprint 6** - Sistema de Reportes: reportes con graficos, exportacion Excel/PDF, dashboard de reportes
- **Sprint 7** - Modulo de Administracion: catalogos, usuarios avanzado, perfiles, permisos granulares, auditoria

### Notas Tecnicas
- Tipos jerarquicos: tabla tipos usa parent_id para relaciones padre-hijo
- Coordenadas heredadas: incidencias y estructuras pueden heredar coords de cruces
- Conversion a mayusculas: todos los campos de texto se convierten automaticamente
- Password management: sistema de mostrar/ocultar en UI, almacenado encriptado
- Sistema de permisos: validacion doble en backend (guards) y frontend (componentes protegidos)ente
- Password management: sistema de mostrar/ocultar en UI, almacenado encriptado

---

Ultima actualizacion: 2024 - Alexander Laines

