# Base de Datos - Sistema de Monitoreo de Semáforos

## Información General

- **Motor**: PostgreSQL 13.22
- **Extensiones**: PostGIS (para datos geoespaciales)
- **Base de datos actual**: `monitoreo`
- **Servidor**: 192.168.18.230

## Tablas Principales

### **Módulo de Incidencias (Core)**

#### `tickets`
Tabla principal de incidencias/tickets reportados.
- `id`: Identificador único
- `incidencia_id`: FK a tipos de incidencia
- `prioridade_id`: FK a prioridades
- `cruce_id`: FK a intersección afectada
- `equipo_id`: FK a equipo asignado
- `descripcion`: Detalle de la incidencia
- `created`: Fecha de creación
- `usuario_registra`: Usuario que registra
- `modified`: Fecha de modificación
- `usuario_finaliza`: Usuario que finaliza
- `estado_id`: FK a estado (Pendiente, En Proceso, Finalizado, etc.)
- `reportadore_id`: FK a quien reporta
- `reportadore_nombres`: Nombre de quien reporta
- `reportadore_dato_contacto`: Dato de contacto (teléfono/whatsapp)
- `geom`: Geometría PostGIS (Point) - Ubicación del incidente

#### `incidencias`
Catálogo jerárquico de tipos de incidencias (árbol).
- `id`: Identificador único
- `parent_id`: FK al padre (NULL = raíz)
- `tipo`: Nombre del tipo de incidencia
- `estado`: Activo/Inactivo
- `prioridade_id`: Prioridad por defecto
- `caracteristica`: 'I' = Incidencia, 'T' = Trabajo

#### `ticket_seguimientos`
Seguimientos/tracking de cada ticket.
- `id`: Identificador único
- `ticket_id`: FK al ticket
- `equipo_id`: Equipo que realiza el seguimiento
- `responsable_id`: Responsable del seguimiento
- `reporte`: Descripción del seguimiento
- `estado_id`: Estado después del seguimiento
- `created`: Fecha del seguimiento
- `usuario_registra`: Usuario que registra

#### `reportadores`
Catálogo de fuentes de reporte (Waze, WhatsApp, Llamadas, Campo).
- `id`: Identificador único
- `nombre`: Nombre del reportador
- `estado`: Activo/Inactivo

#### `estados`
Catálogo de estados de tickets (Pendiente, En Proceso, Resuelto, etc.).
- `id`: Identificador único
- `nombre`: Nombre del estado
- `estado`: Activo/Inactivo

#### `prioridades`
Catálogo de prioridades (Alta, Media, Baja).
- `id`: Identificador único
- `nombre`: Nombre de la prioridad

---

### **Módulo de Semáforos e Intersecciones**

#### `cruces`
Intersecciones/cruces semaforizados.
- `id`: Identificador único
- `ubigeo_id`: FK a ubicación geográfica
- `tipo_gestion`: Tipo de gestión
- `administradore_id`: FK a administrador de zona
- `proyecto_id`: FK a proyecto
- `via1`: FK a eje/vía 1
- `via2`: FK a eje/vía 2
- `tipo_comunicacion`: Tipo de comunicación
- `estado`: Activo/Inactivo
- `tipo_cruce`: Tipo de cruce
- `tipo_estructura`: Tipo de estructura
- `plano_pdf`: Ruta al plano PDF
- `plano_dwg`: Ruta al plano DWG
- `tipo_operacion`: Tipo de operación
- `ano_implementacion`: Año de implementación
- `observaciones`: Observaciones
- `nombre`: Nombre de la intersección
- `latitud`: Latitud
- `longitud`: Longitud
- `codigo`: Código único del cruce
- `tipo_control`: Tipo de control
- `codigo_anterior`: Código anterior
- `usuario_registra`: Usuario que registra
- `electrico_empresa`: Empresa eléctrica
- `electrico_suministro`: Suministro eléctrico
- `geom`: Geometría PostGIS (Point)

#### `perifericos`
Periféricos asociados a intersecciones (cámaras, detectores, etc.).
- Relación muchos a muchos con `cruces` a través de `cruces_perifericos`

#### `administradores`
Administradores de zonas/áreas.
- `id`: Identificador único
- `nombre`: Nombre del administrador
- `responsable`: Responsable
- `telefono`: Teléfono
- `email`: Email
- `estado`: Activo/Inactivo

---

### **Módulo de Usuarios y Seguridad**

#### `users`
Usuarios del sistema.
- `id`: Identificador único
- `persona_id`: FK a datos personales
- `usuario`: Nombre de usuario (login)
- `grupo_id`: FK a rol/grupo
- `clave`: Contraseña (legacy)
- `password_hash`: Hash de contraseña
- `area_id`: FK a área de trabajo
- `estado`: Activo/Inactivo
- `online`: Estado de conexión

#### `personas`
Datos personales de usuarios.
- Información completa de la persona

#### `grupos`
Roles del sistema (PUBLICO, OPERADOR, SUPERVISOR, ADMINISTRADOR).
- `id`: Identificador único
- `nombre`: Nombre del rol

#### `grupos_menus`
Permisos de acceso a menús por rol.
- Relación muchos a muchos entre grupos y menús

#### `menus`
Menús del sistema.
- Estructura jerárquica de menús

---

### **Módulo de Mantenimiento**

#### `equipos`
Equipos de mantenimiento.
- `id`: Identificador único
- `nombre`: Nombre del equipo
- `estado`: Activo/Inactivo

#### `responsables`
Responsables de equipos de mantenimiento.
- `id`: Identificador único
- Relación con `equipos`

---

### **Tablas de Soporte**

#### `areas`
Áreas de trabajo.

#### `ubigeos`
Ubicaciones geográficas (distritos).

#### `ejes`
Ejes viales/avenidas.

#### `tipos`
Tipos genéricos (catálogo maestro).

#### `proyectos`
Proyectos de implementación.

---

### **Auditoría**

#### `audits`
Registro de auditoría de cambios.

#### `audit_deltas`
Detalle de cambios (campo por campo).

---

## Características Especiales

### PostGIS
- Campo `geom` tipo `geometry(Point, 4326)` en tablas `cruces` y `tickets`
- SRID 4326 (WGS 84) para coordenadas GPS

### Timestamps CakePHP
- Campos `created` y `modified` en la mayoría de tablas
- Seguimiento automático de fechas

### Jerarquías
- `incidencias`: Estructura de árbol con `parent_id`
- `menus`: Estructura de árbol con `parent_id`

---

## Próximos Pasos

1. Esquema actual exportado
2. ⏳ Mapeo a Prisma Schema
3. ⏳ Propuesta de mejoras y normalización
4. ⏳ Plan de migración de datos
