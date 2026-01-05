# Sprint 7: Modulo de Administracion

**Estado:** ✅ COMPLETADO (4 enero 2026)  
**Prioridad:** Alta  
**Estimacion:** 3 semanas  
**Tiempo Real:** 2 días

## Objetivo

Implementar modulo completo de administracion del sistema que centralice la gestion de catalogos (tabla tipos), usuarios, perfiles de usuario y sistema de permisos granulares, permitiendo una administracion integral de la aplicacion.

## Contexto

Actualmente el sistema tiene gestion basica de usuarios. Se requiere un modulo administrativo robusto que permita:
- Mantenimiento de catalogos jerarquicos (tipos)
- Gestion avanzada de usuarios
- Creacion y asignacion de perfiles
- Control granular de permisos por modulo y accion

## User Stories

### US-7.1: Mantenimiento de Tabla Tipos
**Como** administrador  
**Quiero** gestionar la tabla de tipos jerarquicos  
**Para** mantener actualizados los catalogos del sistema

**Criterios de Aceptacion:**
- Acceso a seccion "Catalogos" en modulo administracion
- Visualizacion jerarquica de tipos (arbol expandible)
- Agrupacion por tipo padre:
  - TIPO_CRUCE
  - GESTION
  - OPERACION
  - CONTROL
  - COMUNICACION
  - ESTRUCTURA
  - TIPO_PERIFERICO
  - TIPO_INCIDENCIA
  - PRIORIDAD
  - ESTADO
- CRUD completo:
  - Crear tipo (codigo, nombre, descripcion, parent_id)
  - Editar tipo existente
  - Eliminar tipo (validar que no tenga dependencias)
  - Activar/Desactivar tipo
- Validaciones:
  - Codigo unico
  - Parent_id valido si es subtipo
  - No eliminar tipos con registros asociados
- Ordenamiento manual de tipos (opcional)

### US-7.2: Gestion Avanzada de Usuarios
**Como** administrador  
**Quiero** gestionar usuarios del sistema con mayor detalle  
**Para** tener control completo de accesos

**Criterios de Aceptacion:**
- Listado de usuarios con filtros:
  - Estado (activo, inactivo, bloqueado)
  - Perfil asignado
  - Fecha de creacion
  - Ultimo acceso
- Formulario de usuario con campos:
  - Nombre completo
  - Email (unico)
  - Username (unico)
  - Password (encriptado)
  - Perfil (select)
  - Estado (activo/inactivo)
  - Foto de perfil (opcional)
  - Telefono (opcional)
  - Cargo (opcional)
- Acciones:
  - Crear nuevo usuario
  - Editar usuario
  - Cambiar password (forzar cambio en proximo login)
  - Activar/Desactivar usuario
  - Bloquear usuario (por intentos fallidos)
  - Eliminar usuario (soft delete)
- Validaciones:
  - Email formato valido
  - Password minimo 8 caracteres, con mayuscula, minuscula y numero
  - Username alfanumerico sin espacios
- Auditoria: registrar cambios realizados

### US-7.3: Gestion de Perfiles
**Como** administrador  
**Quiero** crear y gestionar perfiles de usuario  
**Para** agrupar permisos por roles

**Criterios de Aceptacion:**
- Perfiles predefinidos:
  - SUPER_ADMIN (todos los permisos)
  - ADMINISTRADOR (gestion completa excepto configuracion)
  - SUPERVISOR (visualizacion y reportes)
  - OPERADOR (CRUD de incidencias y consultas)
  - TECNICO (solo seguimientos de incidencias asignadas)
  - CONSULTA (solo lectura)
- CRUD de perfiles:
  - Crear perfil personalizado
  - Editar nombre y descripcion
  - Asignar permisos (checkboxes por modulo)
  - Clonar perfil existente
  - Eliminar perfil (validar que no tenga usuarios)
- Cada perfil muestra:
  - Nombre
  - Descripcion
  - Cantidad de usuarios asignados
  - Permisos otorgados (resumen)
  - Fecha de creacion
- No permitir editar perfiles del sistema (SUPER_ADMIN, ADMINISTRADOR)

### US-7.4: Sistema de Permisos Granulares
**Como** administrador  
**Quiero** asignar permisos especificos por modulo y accion  
**Para** tener control detallado de accesos

**Criterios de Aceptacion:**
- Matriz de permisos por modulo:
  - **Incidencias**: Ver, Crear, Editar, Eliminar, Asignar, Seguimiento
  - **Cruces**: Ver, Crear, Editar, Eliminar, Exportar
  - **Perifericos**: Ver, Crear, Editar, Eliminar, Asociar
  - **Estructuras**: Ver, Crear, Editar, Eliminar, Asociar
  - **Usuarios**: Ver, Crear, Editar, Eliminar, Cambiar Password
  - **Reportes**: Generar, Exportar, Programar
  - **Catalogos**: Ver, Crear, Editar, Eliminar
  - **Dashboard**: Acceder
  - **Mapas**: Ver Cruces, Ver Incidencias
- Interfaz de asignacion:
  - Tabla con modulos en filas
  - Acciones en columnas (checkboxes)
  - Seleccionar todos / Deseleccionar todos por modulo
  - Seleccionar todos / Deseleccionar todos por accion
- Guardar permisos asociados a perfil
- Validacion en backend de permisos antes de ejecutar acciones

### US-7.5: Guards de Permisos en Backend
**Como** desarrollador backend  
**Quiero** implementar guards de autorizacion  
**Para** proteger endpoints segun permisos

**Criterios de Aceptacion:**
- Crear tabla `perfiles` con campos:
  - id, nombre, descripcion, esSistema, createdAt, updatedAt
- Crear tabla `permisos` con campos:
  - id, perfilId, modulo, accion, createdAt
- Agregar campo `perfilId` a tabla `users`
- Crear decorador `@RequirePermission(modulo, accion)`
- Implementar guard `PermissionsGuard`:
  - Verificar JWT valido
  - Extraer usuario y perfil
  - Consultar permisos del perfil
  - Permitir o denegar acceso
- Aplicar guard a todos los endpoints protegidos
- Excepcion: SUPER_ADMIN siempre tiene acceso
- Respuesta 403 Forbidden si no tiene permiso

### US-7.6: Proteccion de Rutas en Frontend
**Como** desarrollador frontend  
**Quiero** proteger rutas y componentes segun permisos  
**Para** ocultar opciones no autorizadas

**Criterios de Aceptacion:**
- Crear hook `usePermissions()`:
  - Retorna funcion `hasPermission(modulo, accion)`
  - Lee permisos del usuario autenticado (Zustand)
- Crear componente `<ProtectedRoute>`:
  - Verifica permiso requerido
  - Redirige a /unauthorized si no tiene permiso
- Aplicar proteccion a rutas en App.tsx
- Crear componente `<Can>`:
  - Renderiza children solo si tiene permiso
  - Uso: `<Can module="cruces" action="crear">...</Can>`
- Ocultar opciones de menu sin permiso
- Deshabilitar botones sin permiso
- Cargar permisos al hacer login (incluir en respuesta JWT)

### US-7.7: Interfaz del Modulo de Administracion
**Como** usuario administrador  
**Quiero** una interfaz centralizada de administracion  
**Para** acceder a todas las funciones administrativas

**Criterios de Aceptacion:**
- Crear pagina `/administracion` con tabs:
  - Catalogos (tabla tipos)
  - Usuarios
  - Perfiles
  - Permisos
  - Auditoria (futuro)
  - Configuracion General (futuro)
- Solo visible para usuarios con perfil SUPER_ADMIN o ADMINISTRADOR
- Sidebar muestra opcion "Administracion" con icono de engranaje
- Cada tab con su interfaz dedicada
- Diseno consistente con el resto de la aplicacion
- Breadcrumbs para navegacion

### US-7.8: Auditoria de Cambios Administrativos
**Como** administrador  
**Quiero** ver un log de cambios en configuracion  
**Para** rastrear modificaciones criticas

**Criterios de Aceptacion:**
- Crear tabla `auditoria` con campos:
  - id, usuarioId, modulo, accion, descripcion, datosAnteriores (JSON), datosNuevos (JSON), ip, createdAt
- Registrar en auditoria:
  - Creacion/edicion/eliminacion de usuarios
  - Creacion/edicion/eliminacion de perfiles
  - Cambios en permisos
  - Cambios en catalogos (tipos)
- Interfaz de visualizacion:
  - Tabla con filtros (usuario, modulo, fecha)
  - Detalle de cambio en modal
  - Comparacion antes/despues (diff)
- No permitir eliminar registros de auditoria
- Exportar log a Excel

### US-7.9: Configuracion General del Sistema
**Como** administrador  
**Quiero** gestionar parametros generales del sistema  
**Para** personalizar comportamiento de la aplicacion

**Criterios de Aceptacion:**
- Crear tabla `configuracion` con campos:
  - id, clave (unico), valor (text), tipo (string, number, boolean, json), descripcion, grupoConfig
- Parametros configurables:
  - **General**: Nombre de la entidad, logo, email de contacto
  - **Notificaciones**: Habilitar/deshabilitar emails, habilitar notificaciones
  - **Incidencias**: Dias para considerar incidencia sin atencion, auto-asignacion
  - **Sesion**: Tiempo de expiracion JWT, intentos maximos de login
  - **Mapas**: Coordenadas por defecto, zoom inicial, capa predeterminada
  - **Reportes**: Logo para reportes, pie de pagina
- Interfaz de configuracion agrupada por seccion
- Validacion segun tipo de dato
- Efecto inmediato al guardar (sin reiniciar servidor)

### US-7.10: Migraciones y Seeds de Perfiles
**Como** desarrollador  
**Quiero** crear migraciones y seeds para perfiles y permisos  
**Para** inicializar sistema de autorizacion

**Criterios de Aceptacion:**
- Migracion para tablas:
  - perfiles
  - permisos
  - auditoria
  - configuracion
- Seed de perfiles predefinidos:
  - SUPER_ADMIN con todos los permisos
  - ADMINISTRADOR con permisos administrativos
  - SUPERVISOR con permisos de consulta y reportes
  - OPERADOR con CRUD de incidencias
  - TECNICO con solo seguimientos
  - CONSULTA con solo lectura
- Asignar perfil SUPER_ADMIN al usuario inicial
- Seed de configuracion por defecto

## Tareas Tecnicas

### Backend
1. [ ] Crear migracion para tablas: perfiles, permisos, auditoria, configuracion
2. [ ] Actualizar modelo User con campo perfilId
3. [ ] Crear modulo NestJS `administracion`
4. [ ] Implementar CRUD de perfiles (controller, service, DTOs)
5. [ ] Implementar CRUD de permisos
6. [ ] Implementar gestion avanzada de usuarios
7. [ ] Implementar CRUD de tipos (catalogos)
8. [ ] Implementar endpoints de configuracion
9. [ ] Crear decorador `@RequirePermission`
10. [ ] Implementar `PermissionsGuard`
11. [ ] Aplicar guards a todos los endpoints
12. [ ] Implementar servicio de auditoria (interceptor)
13. [ ] Crear seed de perfiles y permisos
14. [ ] Modificar endpoint /auth/login para incluir permisos en JWT
15. [ ] Testing de guards y permisos
16. [ ] Documentar en Swagger

### Frontend
1. [ ] Crear pagina `Administracion.tsx` con tabs
2. [ ] Crear componentes:
   - `CatalogosMantenimiento.tsx` (tabla tipos)
   - `UsuariosAdmin.tsx` (gestion usuarios)
   - `PerfilesAdmin.tsx` (CRUD perfiles)
   - `PermisosMatrix.tsx` (matriz de permisos)
   - `AuditoriaLog.tsx` (log de auditoria)
   - `ConfiguracionGeneral.tsx`
3. [ ] Crear service `administracionService.ts`
4. [ ] Implementar hook `usePermissions()`
5. [ ] Crear componente `<ProtectedRoute>`
6. [ ] Crear componente `<Can>`
7. [ ] Actualizar Zustand store con permisos del usuario
8. [ ] Proteger todas las rutas sensibles
9. [ ] Ocultar opciones de menu sin permiso
10. [ ] Agregar "Administracion" al menu lateral (solo admin)
11. [ ] Actualizar login para cargar permisos
12. [ ] Estilos y responsividad
13. [ ] Testing de componentes y permisos

## Definicion de Hecho

- [ ] Tablas de BD creadas y migradas
- [ ] Perfiles y permisos seed cargados
- [ ] CRUD de catalogos (tipos) funcional
- [ ] Gestion avanzada de usuarios implementada
- [ ] CRUD de perfiles funcional
- [ ] Sistema de permisos granulares operativo
- [ ] Guards aplicados en backend
- [ ] Rutas protegidas en frontend
- [ ] Auditoria registrando cambios
- [ ] Modulo administracion accesible desde menu
- [ ] Solo usuarios autorizados acceden a administracion
- [ ] Sin errores en consola
- [ ] Documentacion actualizada

## Riesgos y Dependencias

### Riesgos
- Complejidad del sistema de permisos puede afectar performance
- Migracion de usuarios existentes a nuevo sistema de perfiles
- Posible bloqueo de usuarios admin si se configura mal

### Dependencias
- Sprints 1-4 completados (base de usuarios y modulos)
- Sistema de autenticacion JWT funcionando
- Tabla usuarios existente

### Mitigaciones
- Crear usuario SUPER_ADMIN de emergencia
- Documentar bien la asignacion inicial de permisos
- No permitir que el ultimo SUPER_ADMIN se elimine o desactive

## Notas Adicionales

- Implementar mecanismo de recuperacion si admin queda bloqueado
- Considerar permiso especial "SUPER_ADMIN" que siempre tenga acceso total
- Tipos del sistema (PRIORIDAD, ESTADO) no deben poder eliminarse
- Perfiles del sistema no deben poder editarse ni eliminarse
- Auditoria debe incluir IP del usuario que realiza cambio
- Cache de permisos en frontend para mejor UX
- Validar permisos tanto en frontend como backend (doble validacion)

---

**Proximos Sprints Sugeridos:**
- Sprint 8: Notificaciones en Tiempo Real (WebSockets)
- Sprint 9: Integraciones Externas
- Sprint 10: App Movil para Tecnicos
