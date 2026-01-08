# Guía de Mejores Prácticas para Manejo de Zonas Horarias

## 📅 Fecha de Creación
2026-01-08

## 🎯 Objetivo
Estandarizar el manejo de fechas y horas en todo el sistema para evitar inconsistencias entre servidores, base de datos y clientes en diferentes zonas horarias.

## 🌍 Situación Actual del Sistema

### Servidores
- **apps.movingenia.com**: UTC (GMT+0)
- **dbsrv.movingenia.com**: UTC (GMT+0)

### Usuarios
- **Ubicación principal**: Lima, Perú (GMT-5)
- **Zona horaria**: America/Lima

## ⚠️ Problema Identificado

### Antes de la Corrección
Las tablas usaban `timestamp without time zone`:
- PostgreSQL guardaba la hora sin información de zona horaria
- Causaba ambigüedad: ¿es UTC? ¿Es hora local?
- Al mostrar, había diferencias de 1 hora inexplicables

### Ejemplo del Problema
```sql
-- Columna: timestamp without time zone
connected_at | 2026-01-08 12:26:41.69
```
❓ ¿Esta hora es UTC? ¿Es hora de Lima? **No se puede saber**

## ✅ Solución Implementada

### 1. Base de Datos: Usar `timestamptz`

```sql
-- CORRECTO: timestamp with time zone
ALTER TABLE user_sessions 
  ALTER COLUMN connected_at TYPE timestamptz;
```

**Ventajas:**
- ✅ Siempre almacena en UTC internamente
- ✅ Acepta fechas en cualquier zona horaria
- ✅ Convierte automáticamente a UTC
- ✅ Al consultar, se puede mostrar en cualquier zona horaria

### 2. Backend: Siempre UTC

```typescript
// ✅ CORRECTO
const now = new Date(); // JavaScript Date siempre es UTC internamente

// Prisma automáticamente maneja timestamptz
await prisma.userSession.create({
  data: {
    connectedAt: new Date(), // Se guarda como UTC en la BD
  }
});
```

**Configuración de Prisma:**
```prisma
model UserSession {
  id            Int       @id @default(autoincrement())
  connectedAt   DateTime  @default(now()) @map("connected_at") @db.Timestamptz(3)
  lastActivity  DateTime  @default(now()) @map("last_activity") @db.Timestamptz(3)
  // ...
}
```

### 3. Frontend: Mostrar en Hora Local

```typescript
// ✅ CORRECTO: Mostrar en hora local del navegador
const date = new Date(incident.createdAt);

// Opción 1: toLocaleString (hora del navegador)
date.toLocaleString('es-PE', {
  timeZone: 'America/Lima',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

// Opción 2: Usar date-fns con zona horaria
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

format(date, "dd/MM/yyyy HH:mm:ss", { locale: es });
```

## 📋 Reglas de Oro

### 1. **Almacenamiento: Siempre UTC**
```javascript
// ✅ BIEN
await prisma.incident.create({
  data: {
    createdAt: new Date(), // UTC
  }
});

// ❌ MAL
await prisma.incident.create({
  data: {
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // Restando horas manualmente
  }
});
```

### 2. **Transmisión: ISO 8601 con Zona Horaria**
```javascript
// ✅ BIEN
const dateString = date.toISOString(); // "2026-01-08T12:26:41.690Z"

// ❌ MAL
const dateString = date.toString(); // "Thu Jan 08 2026 07:26:41 GMT-0500"
```

### 3. **Visualización: Hora Local del Usuario**
```javascript
// ✅ BIEN - El navegador convierte automáticamente
new Date('2026-01-08T12:26:41.690Z').toLocaleString('es-PE');
// Muestra: "08/01/2026 07:26:41" (hora de Lima)

// ❌ MAL - Conversión manual propensa a errores
const limaTime = new Date(utcTime.getTime() - 5 * 60 * 60 * 1000);
```

## 🔧 Implementación Paso a Paso

### Paso 1: Migración de Base de Datos

```bash
# Aplicar migración de zonas horarias
psql -h dbsrv.movingenia.com -U transito -d monitoreo \
  -f database/migrations/009-fix-timezone-timestamps.sql
```

### Paso 2: Actualizar Esquema de Prisma

```prisma
// apps/backend/prisma/schema.prisma

model UserSession {
  id            Int       @id @default(autoincrement())
  userId        Int       @map("user_id")
  socketId      String    @unique @map("socket_id") @db.VarChar(255)
  ipAddress     String?   @map("ip_address") @db.VarChar(45)
  userAgent     String?   @map("user_agent") @db.Text
  connectedAt   DateTime  @default(now()) @map("connected_at") @db.Timestamptz(3)
  lastActivity  DateTime  @default(now()) @map("last_activity") @db.Timestamptz(3)
  disconnectedAt DateTime? @map("disconnected_at") @db.Timestamptz(3)
  isActive      Boolean   @default(true) @map("is_active")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([socketId])
  @@index([isActive])
  @@map("user_sessions")
}

model Notification {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  type      String   @db.VarChar(50)
  title     String   @db.VarChar(255)
  message   String   @db.Text
  data      Json?    @db.JsonB
  isRead    Boolean  @default(false) @map("is_read")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  readAt    DateTime? @map("read_at") @db.Timestamptz(3)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
  @@map("notifications")
}
```

### Paso 3: Regenerar Cliente Prisma

```bash
cd apps/backend
npx prisma generate
```

### Paso 4: Actualizar Frontend (si es necesario)

Crear utilidad para formateo consistente:

```typescript
// apps/frontend/src/utils/dateUtils.ts
export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('es-PE', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatTime = (date: string | Date): string => {
  return new Date(date).toLocaleTimeString('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};
```

## 🧪 Verificación

### Test en Backend
```typescript
// apps/backend/src/utils/timezone.spec.ts
describe('Timezone handling', () => {
  it('should save dates in UTC', async () => {
    const session = await prisma.userSession.create({
      data: {
        userId: 1,
        socketId: 'test-socket',
        connectedAt: new Date(),
      },
    });

    // La fecha guardada debe estar cerca de NOW() en UTC
    const diff = Math.abs(new Date().getTime() - session.connectedAt.getTime());
    expect(diff).toBeLessThan(1000); // Menos de 1 segundo de diferencia
  });
});
```

### Verificación en Base de Datos
```sql
-- Verificar tipo de columna
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_sessions' 
  AND column_name = 'connected_at';
-- Debe mostrar: timestamp with time zone

-- Verificar datos
SELECT 
  id,
  connected_at,
  connected_at AT TIME ZONE 'America/Lima' as hora_lima
FROM user_sessions
ORDER BY id DESC
LIMIT 5;
```

## 📊 Comparación Antes vs Después

### Antes (timestamp without time zone)
```sql
connected_at | 2026-01-08 12:26:41.69
```
❌ Ambiguo, no se sabe la zona horaria

### Después (timestamptz)
```sql
connected_at              | hora_lima
--------------------------+-------------------------
2026-01-08 12:26:41.69+00 | 2026-01-08 07:26:41.69-05
```
✅ Claro: UTC +00, Lima -05

## 🎓 Recursos Adicionales

- [PostgreSQL Timestamp Documentation](https://www.postgresql.org/docs/current/datatype-datetime.html)
- [JavaScript Date and Time](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [Prisma DateTime Documentation](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#datetime)
- [date-fns Time Zone Support](https://date-fns.org/docs/Time-Zones)

## 🔒 Resumen Ejecutivo

1. **Base de datos**: Use `timestamptz` para todas las columnas de fecha/hora
2. **Backend**: Siempre trabaje en UTC, use `new Date()` sin ajustes manuales
3. **API**: Transmita fechas en formato ISO 8601 (`toISOString()`)
4. **Frontend**: Use `toLocaleString()` o `date-fns` para mostrar en hora local
5. **NUNCA**: Haga aritmética manual de zonas horarias (restar/sumar horas)

**Regla de oro**: UTC para almacenar, hora local para mostrar.
