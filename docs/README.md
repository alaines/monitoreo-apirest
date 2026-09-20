# ÍNDICE GENERAL DE DOCUMENTACIÓN
## Sistema de Control y Monitoreo de Intersecciones Semafóricas e Incidencias
**Versión del Sistema**: v1.2.0  
**Fecha de Actualización**: Septiembre 2026  

---

## 📚 Manuales Principales

1. **[Manual de Usuario](MANUAL_USUARIO.md)**  
   Guía completa para operadores, supervisores y administradores. Detalla el Centro de Control y Monitoreo, mapa de clustering jerárquico por severidad, gestión del ciclo de vida de incidencias, catálogo de cruces y reportes estadísticos.

2. **[Manual de Instalación y Despliegue](MANUAL_INSTALACION.md)**  
   Procedimiento integral para instalar y desplegar el sistema usando **Docker Compose** (recomendado) o en servidores dedicados mediante **PM2**, configuración de PostgreSQL + PostGIS, variables de entorno y proxy inverso Nginx con WebSockets.

3. **[Manual de Mantenimiento y Operaciones](MANUAL_MANTENIMIENTO.md)**  
   Guía técnica para administradores de sistemas y DevOps. Incluye comandos de operación diaria, estrategia de backups (`backups/`), restauración de base de datos, reglas obligatorias de compilación, gestión de migraciones Prisma y solución de problemas.

4. **[Estado del Proyecto y Balance de Sprints](ESTADO_PROYECTO_SPRINTS.md)**  
   Evaluación del estado de los Sprints (0 al 10), detalle de módulos completados y backlog priorizado de funcionalidades pendientes (Roadmap).

---

## 📂 Estructura de la Documentación

- **`/docs`**:
  - `MANUAL_USUARIO.md` - Manual operativo para usuarios finales y operadores.
  - `MANUAL_INSTALACION.md` - Guía de instalación y despliegue del sistema.
  - `MANUAL_MANTENIMIENTO.md` - Guía de operaciones, backups y mantenimiento.
  - `ESTADO_PROYECTO_SPRINTS.md` - Balance de sprints y funcionalidades implementadas vs pendientes.
  - `DESIGN_SYSTEM.md` - Guía del sistema de diseño (Bootstrap 5 + FontAwesome 6).
  - `MAPA_CALOR_README.md` - Documentación técnica del mapa de calor de incidencias.
  - `REPORTE_GRAFICO.md` - Especificación técnica del módulo de reportes gráficos.
  - `gestion-menus-tree-behavior.md` - Documentación del árbol jerárquico de menús (Nested Set).
- **`/docs/sprints`**: Historial de planificación de historias de usuario por sprint.
- **`/docs/sprints-completed`**: Resúmenes de cierre de sprints anteriores.
- **`/docs/guides`**: Guías complementarias (imágenes, versionamiento, zonas horarias).
- **`/docs/screenshots`**: Capturas de pantalla oficiales de la aplicación.
- **`/archive`**: Archivo histórico de reportes temporales y borradores obsoletos.
