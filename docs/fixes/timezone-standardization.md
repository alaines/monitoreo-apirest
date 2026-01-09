# Resumen: Estandarización de Zonas Horarias

## Fecha
2026-01-08

## Problema Reportado
Al loguearse en producción (http://apps.movingenia.com), las horas mostradas tenían **1 hora de diferencia** con respecto a la hora actual de Lima, Perú (GMT-5).

## Causa Raíz Identificada

El sistema tenía configuraciones inconsistentes de zona horaria:

### Configuración Previa
| Componente | Zona Horaria | Estado |
|------------|--------------|--------|
| Servidor apps.movingenia.com | UTC (GMT+0) | |
| Base de datos dbsrv.movingenia.com | UTC (GMT+0) | |
| Usuarios (Lima, Perú) | America/Lima (GMT-5) | |
| Columnas de BD | `timestamp without time zone` | **Problema principal** |

### El Problema
- Las columnas usaban **`timestamp without time zone`** 
- PostgreSQL guardaba la hora "tal cual" sin información de zona horaria
- No había forma de saber si era UTC, hora local, u otra zona horaria
- Al mostrar las fechas, había ambigüedad y conversiones incorrectas

## Solución Implementada

### 1. Migración de Base de Datos
**Archivo**: `database/migrations/009-fix-timezone-timestamps.sql`

Convertidas todas las columnas a **`timestamptz`** (timestamp WITH time zone):

```sql
-- user_sessions
ALTER TABLE user_sessions 
  ALTER COLUMN connected_at TYPE timestamptz,
  ALTER COLUMN last_activity TYPE timestamptz,
  ALTER COLUMN disconnected_at TYPE timestamptz;

-- notifications  
ALTER TABLE notifications 
  ALTER COLUMN created_at TYPE timestamptz,
  ALTER COLUMN read_at TYPE timestamptz;

-- auditoria
ALTER TABLE auditoria 
  ALTER COLUMN created TYPE timestamptz;
```

### 2. Actualización de Prisma Schema
**Archivo**: `apps/backend/prisma/schema.prisma`

```prisma
model UserSession {
  connectedAt   DateTime  @default(now()) @db.Timestamptz(3)
  lastActivity  DateTime  @default(now()) @db.Timestamptz(3)
  disconnectedAt DateTime? @db.Timestamptz(3)
  // ...
}

model Notification {
  createdAt DateTime  @default(now()) @db.Timestamptz(3)
  readAt    DateTime? @db.Timestamptz(3)
  // ...
}
```

### 3. Utilidades de Formateo Frontend
**Archivo**: `apps/frontend/src/utils/dateUtils.ts`

Funciones para conversión automática a hora de Lima:

```typescript
// Formateo completo: DD/MM/YYYY HH:mm:ss
formatDateTime(date: string | Date): string

// Solo fecha: DD/MM/YYYY
formatDate(date: string | Date): string

// Solo hora: HH:mm:ss
formatTime(date: string | Date): string

// Hora relativa: "Hace 5 minutos"
formatRelativeTime(date: string | Date): string
```

### 4. Documentación
**Archivo**: `docs/guides/TIMEZONE-BEST-PRACTICES.md`

Guía completa de mejores prácticas para manejo de zonas horarias.

## Resultado Final

### Antes
```sql
connected_at | 2026-01-08 12:26:41.69
```
**Ambiguo**: ¿Es UTC? ¿Es hora de Lima?

### Después
```sql
connected_at              | hora_lima
--------------------------+-------------------------
2026-01-08 12:33:34.085+00| 2026-01-08 07:33:34.085
```
**Claro**: 
- Almacenado en UTC: `12:33:34 +00`
- Mostrado en Lima: `07:33:34` (5 horas menos)

## Verificación

### Prueba Realizada
```bash
# Conexión WebSocket a las 12:33:34 UTC
Conectado a las: 2026-01-08T12:33:34.085Z
```

### Resultado en Base de Datos
```sql
SELECT 
  connected_at,                           -- UTC
  connected_at AT TIME ZONE 'America/Lima' -- Lima
FROM user_sessions;

        connected_at        |        hora_lima        
----------------------------+-------------------------
 2026-01-08 12:33:34.085+00 | 2026-01-08 07:33:34.085
```

**Diferencia correcta**: 5 horas (GMT-5)

## Reglas Establecidas

1. **Almacenamiento**: Siempre UTC con `timestamptz`
2. **Transmisión**: ISO 8601 (`toISOString()`)
3. **Visualización**: Hora local del usuario (`toLocaleString('es-PE')`)
4. **NUNCA**: Aritmética manual de zonas horarias

## Archivos Modificados

- `database/migrations/009-fix-timezone-timestamps.sql` - Migración aplicada
- `apps/backend/prisma/schema.prisma` - Schema actualizado
- `apps/frontend/src/utils/dateUtils.ts` - Utilidades creadas
- `docs/guides/TIMEZONE-BEST-PRACTICES.md` - Documentación completa

## Estado
**RESUELTO**: El sistema ahora maneja correctamente las zonas horarias. Todas las fechas se almacenan en UTC y se muestran automáticamente en hora de Lima (GMT-5) para los usuarios.
