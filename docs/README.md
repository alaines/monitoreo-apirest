# Documentacion del Proyecto

Documentacion tecnica y guias del Sistema de Monitoreo de Semaforos e Incidencias.

## Estructura de Documentacion

### `/architecture` - Arquitectura y Diseno
Documentos relacionados con decisiones arquitectonicas, analisis de diseno y configuracion de servidores.

- **ANALISIS-MUI-DISENO.md** - Analisis de Material-UI y decisiones de diseno de interfaz
- **SERVER-CONFIG.md** - Configuracion de servidores y deployment

### `/guides` - Guias de Uso
Guias rapidas y referencias para desarrolladores.

- **GUIA-RAPIDA.md** - Guia rapida para iniciar el proyecto
- **IMAGENES-Y-ASSETS.md** - Gestion de imagenes y recursos estaticos

### `/sprints` - Planificacion de Sprints
Planificacion activa de sprints y product backlog.

- **product-backlog.md** - Backlog completo del producto
- **sprint-0-setup.md** - Sprint inicial de configuracion
- **sprint-1-auth-users.md** - Autenticacion y usuarios
- **sprint-2-incidents.md** - Gestion de incidencias
- **sprint-4-cruces.md** - Gestion de cruces semaforizados
- **sprint-5-estructuras.md** - Inventario de estructuras (FUTURO)

### `/sprints-completed` - Sprints Completados
Archivo historico de sprints finalizados.

- **sprint-1-COMPLETADO.md** - Sprint 1 completado

### Documento Raiz
- **ESTADO-ACTUAL.md** - Estado actual del proyecto y ultimos cambios

## Navegacion Rapida

### Para Desarrolladores Nuevos
1. Leer [README.md principal](/README.md)
2. Revisar [GUIA-RAPIDA.md](guides/GUIA-RAPIDA.md)
3. Consultar [ESTADO-ACTUAL.md](ESTADO-ACTUAL.md)

### Para Planificacion
1. Revisar [product-backlog.md](sprints/product-backlog.md)
2. Consultar sprints activos en `/sprints`

### Para Arquitectura
1. Revisar documentos en `/architecture`
2. Consultar schema de base de datos en `apps/backend/prisma/schema.prisma`

## Mantenimiento de Documentacion

- Mantener sprints activos en `/sprints`
- Mover sprints completados a `/sprints-completed`
- Actualizar ESTADO-ACTUAL.md con cada cambio significativo
- Documentar decisiones arquitectonicas en `/architecture`
- Crear guias en `/guides` para procesos comunes

---

Ultima actualizacion: 2024
