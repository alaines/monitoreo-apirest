# Sprint 5: Inventario de Estructuras

**Estado:** PLANIFICADO  
**Prioridad:** Media  
**Estimacion:** 2 semanas

## Objetivo

Implementar sistema completo de inventario de estructuras asociadas a cruces semaforizados, permitiendo la catalogacion, gestion y visualizacion de toda la infraestructura fisica de los cruces (postes, columnas, camaras, gabinetes, etc.).

## Contexto

Actualmente el sistema gestiona cruces semaforizados y perifericos tecnicos (controladores, camaras, detectores), pero no registra las estructuras fisicas donde se montan estos dispositivos. Es necesario crear un inventario completo de estructuras para:

- Control de activos fisicos por cruce
- Planificacion de mantenimiento de infraestructura
- Analisis de capacidad de montaje de nuevos dispositivos
- Gestion de garantias de estructuras
- Vinculacion estructura-periferico

## User Stories

### US-5.1: Catalogo de Tipos de Estructuras
**Como** administrador del sistema  
**Quiero** tener tipos de estructuras predefinidos en la tabla tipos  
**Para** poder catalogar correctamente las estructuras registradas

**Criterios de Aceptacion:**
- Crear tipo padre ESTRUCTURA (similar a GESTION, COMUNICACION)
- Agregar subtipos:
  - POSTE METALICO
  - POSTE HORMIGON
  - COLUMNA
  - CAMARA
  - GABINETE
  - BRAZO
  - MENSULA
  - PEDESTAL
  - OTROS
- Cada subtipo debe tener parent_id apuntando al tipo padre ESTRUCTURA
- Incluir campos codigo y descripcion

### US-5.2: Modelo de Datos de Estructuras
**Como** desarrollador  
**Quiero** crear el esquema de base de datos para estructuras  
**Para** almacenar informacion completa de cada estructura

**Criterios de Aceptacion:**
- Crear tabla `estructuras` con campos:
  - id (autoincremental)
  - codigo (unico, alfanumerico)
  - tipoEstructuraId (FK a tipos)
  - altura (decimal, metros)
  - material (string)
  - fabricante (string, opcional)
  - anoInstalacion (integer, opcional)
  - estado (enum: EXCELENTE, BUENO, REGULAR, MALO, MUY_MALO)
  - enGarantia (boolean)
  - fechaGarantia (date, opcional)
  - latitud (decimal, opcional - si estructura esta en cruce hereda coords)
  - longitud (decimal, opcional)
  - observaciones (text, opcional)
  - createdAt (timestamp)
  - updatedAt (timestamp)
- Agregar indices para codigo, tipoEstructuraId, estado
- Validar altura > 0 si se proporciona

### US-5.3: Relacion Cruces-Estructuras
**Como** desarrollador  
**Quiero** crear la tabla de relacion entre cruces y estructuras  
**Para** permitir que un cruce tenga multiples estructuras

**Criterios de Aceptacion:**
- Crear tabla `cruces_estructuras` con:
  - id (autoincremental)
  - cruceId (FK a cruces, ON DELETE CASCADE)
  - estructuraId (FK a estructuras, ON DELETE CASCADE)
  - cantidad (integer, default 1)
  - ubicacionEnCruce (string, opcional - ej: "Esquina NE", "Centro")
  - createdAt (timestamp)
- Constraint UNIQUE en (cruceId, estructuraId) para evitar duplicados
- Indices en cruceId y estructuraId

### US-5.4: Backend - CRUD de Estructuras
**Como** desarrollador backend  
**Quiero** implementar endpoints REST para estructuras  
**Para** permitir operaciones CRUD completas

**Criterios de Aceptacion:**
- Crear modulo NestJS `estructuras`
- Endpoints:
  - `GET /api/estructuras` - Listar con paginacion, filtros (tipo, estado, enGarantia)
  - `GET /api/estructuras/:id` - Detalle de estructura
  - `POST /api/estructuras` - Crear estructura
  - `PATCH /api/estructuras/:id` - Actualizar estructura
  - `DELETE /api/estructuras/:id` - Eliminar (verificar que no este asociada)
- DTOs con validaciones (class-validator)
- Incluir relaciones con tipos en respuestas
- Documentar con Swagger

### US-5.5: Backend - Asociacion Cruce-Estructura
**Como** desarrollador backend  
**Quiero** implementar endpoints para asociar estructuras a cruces  
**Para** gestionar el inventario por cruce

**Criterios de Aceptacion:**
- Endpoints en modulo `cruces`:
  - `GET /api/cruces/:id/estructuras` - Listar estructuras del cruce
  - `POST /api/cruces/:id/estructuras` - Asociar estructura existente
  - `DELETE /api/cruces/:cruceId/estructuras/:estructuraId` - Desasociar
- Validar que estructura y cruce existan antes de asociar
- Evitar duplicados
- Responder con estructura completa al asociar

### US-5.6: Frontend - Formulario de Estructuras
**Como** usuario del sistema  
**Quiero** tener un formulario para registrar estructuras  
**Para** agregar nuevas estructuras al inventario

**Criterios de Aceptacion:**
- Crear componente `EstructuraForm.tsx`
- Campos del formulario:
  - Codigo (text, requerido, uppercase)
  - Tipo de Estructura (select, requerido)
  - Altura en metros (number, opcional)
  - Material (text, opcional)
  - Fabricante (text, opcional)
  - Ano de Instalacion (number, opcional)
  - Estado (select, requerido)
  - En Garantia (checkbox)
  - Fecha de Garantia (date, condicional si enGarantia=true)
  - Observaciones (textarea, opcional)
- Validaciones en tiempo real
- Convertir codigo a mayusculas automaticamente
- Mostrar feedback de exito/error

### US-5.7: Frontend - Listado de Estructuras
**Como** usuario del sistema  
**Quiero** ver un listado de todas las estructuras  
**Para** consultar el inventario completo

**Criterios de Aceptacion:**
- Crear pagina `EstructurasList.tsx`
- Tabla con columnas: Codigo, Tipo, Altura, Material, Estado, Garantia
- Filtros: tipo, estado, en garantia
- Busqueda por codigo/material
- Ordenamiento por cualquier columna
- Paginacion (10, 25, 50 items)
- Botones de accion: Ver Detalle, Editar, Eliminar
- Agregar al menu lateral como "Estructuras"

### US-5.8: Frontend - Gestion de Estructuras en Cruce
**Como** usuario del sistema  
**Quiero** gestionar estructuras desde el detalle de un cruce  
**Para** tener el inventario completo del cruce

**Criterios de Aceptacion:**
- En `CruceDetail.tsx`, agregar seccion "Estructuras"
- Listar estructuras asociadas al cruce
- Boton "Agregar Estructura" que abre modal con:
  - Opcion 1: Crear nueva estructura (formulario completo)
  - Opcion 2: Asociar estructura existente (select con autocomplete)
- Modal para ver detalle de estructura
- Boton para desasociar estructura del cruce
- Contador de estructuras en card header

### US-5.9: Frontend - Vista de Detalle de Estructura
**Como** usuario del sistema  
**Quiero** ver toda la informacion de una estructura  
**Para** consultar sus caracteristicas y estado

**Criterios de Aceptacion:**
- Crear componente `EstructuraDetail.tsx`
- Mostrar todos los campos de la estructura
- Card con informacion organizada en secciones:
  - Identificacion (codigo, tipo)
  - Caracteristicas Fisicas (altura, material)
  - Fabricacion (fabricante, ano)
  - Estado y Garantia
  - Ubicacion (coordenadas si existen)
  - Observaciones
- Listar cruces donde esta asociada
- Botones: Editar, Eliminar, Volver

### US-5.10: Migraciones y Seeds
**Como** desarrollador  
**Quiero** crear migraciones y datos de prueba  
**Para** facilitar el desarrollo y testing

**Criterios de Aceptacion:**
- Crear migracion Prisma para:
  - Tabla estructuras
  - Tabla cruces_estructuras
  - Tipos de estructuras en tabla tipos
- Seed con al menos:
  - 5 tipos de estructuras
  - 10 estructuras de ejemplo
  - 5 asociaciones cruce-estructura
- Documentar en README como ejecutar migraciones

## Tareas Tecnicas

### Backend
1. [ ] Actualizar schema.prisma con modelos Estructura y CruceEstructura
2. [ ] Crear migracion con `npx prisma migrate dev`
3. [ ] Generar tipos TypeScript con `npx prisma generate`
4. [ ] Crear modulo NestJS `estructuras`
5. [ ] Implementar DTOs (CreateEstructuraDto, UpdateEstructuraDto, FilterEstructuraDto)
6. [ ] Implementar service con metodos CRUD
7. [ ] Implementar controller con endpoints REST
8. [ ] Agregar endpoints en modulo cruces para asociaciones
9. [ ] Documentar con decoradores Swagger
10. [ ] Crear seed para tipos y datos de ejemplo
11. [ ] Testing unitario de services
12. [ ] Testing e2e de endpoints

### Frontend
1. [ ] Crear types TypeScript para Estructura
2. [ ] Crear service API `estructurasService.ts`
3. [ ] Crear componente `EstructuraForm.tsx`
4. [ ] Crear componente `EstructurasList.tsx`
5. [ ] Crear componente `EstructuraDetail.tsx`
6. [ ] Integrar gestion en `CruceDetail.tsx`
7. [ ] Agregar opcion "Estructuras" en menu lateral
8. [ ] Agregar ruta `/estructuras` en App.tsx
9. [ ] Estilos y responsividad
10. [ ] Testing de componentes

## Definicion de Hecho

- [ ] Migraciones ejecutadas correctamente
- [ ] Tipos de estructuras cargados en BD
- [ ] Endpoints backend implementados y documentados
- [ ] Formularios frontend funcionales con validaciones
- [ ] Listado con filtros y paginacion operativo
- [ ] Asociacion cruce-estructura funcional
- [ ] Detalle de estructura completo
- [ ] Sin errores en consola
- [ ] Codigo limpio sin console.log
- [ ] Documentacion actualizada
- [ ] Tests basicos implementados

## Riesgos y Dependencias

### Riesgos
- Migracion de datos existentes si hay estructuras ya registradas informalmente
- Complejidad en la relacion muchos-a-muchos con cantidad y ubicacion
- Performance con grandes volumenes de estructuras

### Dependencias
- Sprint 4 (Cruces) debe estar completado
- Tabla tipos debe soportar jerarquia padre-hijo
- Modulo de perifericos puede necesitar asociarse a estructuras (futuro)

## Notas Adicionales

- Este sprint no incluye la relacion estructura-periferico (considerar para Sprint 6)
- Coordenadas de estructura opcionales: si estructura esta en cruce, hereda las del cruce
- El campo `cantidad` en cruces_estructuras permite registrar multiples instancias de la misma estructura
- Estado de estructura independiente del estado del cruce
- Garantia se maneja similar a perifericos

---

**Proximos Sprints Sugeridos:**
- Sprint 6: Relacion Estructura-Periferico (perifericos montados en estructuras)
- Sprint 7: Reportes y Exportacion de Inventario
- Sprint 8: Mantenimiento Preventivo de Estructuras
