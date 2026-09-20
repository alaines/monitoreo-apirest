# MANUAL DE MANTENIMIENTO Y OPERACIONES DEL SISTEMA
## Sistema de Control y Monitoreo de Intersecciones Semafóricas e Incidencias
**Versión del Sistema**: v1.2.0  
**Dirigido a**: Administradores de Sistemas, DBAs y Equipo DevOps  
**Fecha de Actualización**: Septiembre 2026  

---

## 1. Operaciones Diarias y Monitoreo de Servicios

### 1.1. Monitoreo de Contenedores Docker
```bash
# Ver estado de los contenedores y consumo de recursos
docker ps
docker stats --no-stream

# Ver logs en tiempo real de los servicios
docker logs -f --tail 100 monitoreo-backend
docker logs -f --tail 100 monitoreo-frontend
docker logs -f --tail 100 monitoreo-db
```

### 1.2. Reinicio Seguro de Servicios
```bash
# Reiniciar backend y frontend sin afectar la base de datos
docker restart monitoreo-backend monitoreo-frontend

# Reiniciar toda la infraestructura
docker-compose down
docker-compose up -d
```

---

## 2. Gestión de Respaldos (Backups) y Restauración de Base de Datos

### 2.1. Ubicación y Nomenclatura Oficial
Todos los volcados de base de datos deben almacenarse en el directorio:
`backups/`

**Formato de Nombre**: `protransito_YYYY-MM-DD.sql` (o `protransito_YYYYMMDD_HHmm.sql`).

### 2.2. Procedimiento para Generar un Backup (Dump Completo)
```bash
# Opción 1: Generación directa con Docker (Recomendado)
docker exec monitoreo-db pg_dump -U transito -d protransito -F p --clean --if-exists -f /tmp/backup_actual.sql
docker cp monitoreo-db:/tmp/backup_actual.sql backups/protransito_$(date +%Y-%m-%d).sql

# Opción 2: Script directo en Linux/Ubuntu
pg_dump -U transito -h localhost -p 5432 -d protransito -F p --clean --if-exists > backups/protransito_$(date +%Y-%m-%d).sql
```

### 2.3. Procedimiento de Restauración de Base de Datos
```bash
# 1. Copiar el archivo al contenedor de base de datos
docker cp backups/protransito_2026-09-19.sql monitoreo-db:/tmp/restore.sql

# 2. Ejecutar la restauración con psql
docker exec -i monitoreo-db psql -U transito -d protransito -f /tmp/restore.sql

# 3. Regenerar cliente Prisma y reiniciar backend
docker exec monitoreo-backend npx prisma generate
docker restart monitoreo-backend
```

### 2.4. Automatización con Crontab (Backup Diario a las 02:00 AM)
```bash
0 2 * * * docker exec monitoreo-db pg_dump -U transito -d protransito -F p --clean --if-exists > /ruta/al/proyecto/backups/protransito_$(date +\%Y-\%m-\%d).sql
```

---

## 3. Reglas Obligatorias de Compilación y Control de Cambios

### 3.1. Regla de Compilación y Validación
Ante CADA cambio en el código fuente de frontend o backend:
1. **Compilar**: Ejecutar `docker exec monitoreo-frontend npm run build` (debe retornar código de salida `0` sin errores de TypeScript).
2. **Reiniciar**: Ejecutar `docker restart monitoreo-frontend` (y `monitoreo-backend` si hubo cambios en API/Prisma).

### 3.2. Proceso de Release y Versionado
1. Modificar el número de versión en los archivos:
   - `VERSION`
   - `package.json` (Raíz)
   - `apps/backend/package.json`
   - `apps/frontend/package.json`
2. Registrar los cambios en el archivo `CHANGELOG.md` siguiendo el formato SemVer ([Keep a Changelog](https://keepachangelog.com/)).
3. Actualizar `README.md` si se añadieron nuevas variables de entorno o dependencias.

---

## 4. Mantenimiento de Base de Datos y Migraciones con Prisma

### 4.1. Sincronización de Esquema
Cuando se modifique `apps/backend/prisma/schema.prisma`:
```bash
# Generar cliente tipado de Prisma
docker exec monitoreo-backend npx prisma generate

# Aplicar cambios en base de datos sin borrar datos
docker exec monitoreo-backend npx prisma db push
```

### 4.2. Mantenimiento de Índices Críticos
La base de datos cuenta con índices espaciales y de estado:
```sql
-- Índice espacial para PostGIS en cruces
CREATE INDEX IF NOT EXISTS idx_cruces_geom ON cruces USING GIST(geom);

-- Índices de filtrado rápido en tickets
CREATE INDEX IF NOT EXISTS idx_tickets_estado_anho_mes ON tickets(estado_id, anho, mes);
CREATE INDEX IF NOT EXISTS idx_tickets_cruce_id ON tickets(cruce_id);
```

---

## 5. Diagnóstico y Solución de Problemas (Troubleshooting)

| Síntoma / Problema | Causa Probable | Solución Paso a Paso |
|---|---|---|
| **Error en mapa: cruces no cargan o marcan NaN** | Coordenadas nulas o formato incorrecto en tabla `cruces`. | El backend normaliza lat/lng dividiendo entre 10 si vienen como enteros. Verificar con `SELECT id, latitud, longitud FROM cruces WHERE latitud IS NULL`. |
| **Desfase de 5 horas en fechas (UTC vs Hora Perú)** | PostgreSQL almacena `timestamp without time zone` y Prisma asume UTC. | Utilizar comparaciones de strings `YYYY-MM-DD` o conversión con zona horaria `America/Lima` (`-05:00`). |
| **Error en WebSocket (Desconexión frecuente)** | Problema de CORS o timeout de proxy inverso en Nginx. | Verificar directivas `Upgrade` y `Connection "Upgrade"` en la configuración de Nginx para la ruta `/socket.io/`. |
| **Mapa muestra incidencias finalizadas en inicio** | Parámetro `allStates` activo o filtro de estados no restringido. | Verificar que `getMapMarkers` en `incidents.service.ts` aplique por defecto `where.estadoId = { in: [1, 2, 5] }`. |
| **Paginación de cruces falla al avanzar página** | Parámetros de ordenamiento o tipos inválidos en query. | Verificar que `sortOrder` esté en minúsculas (`asc`/`desc`) y el limit sea numérico. |
