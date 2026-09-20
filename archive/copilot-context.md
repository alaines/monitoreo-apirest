# Contexto del Proyecto - Monitoreo API REST

**IMPORTANTE: Este archivo debe ser leído al inicio de cada sesión para entender el entorno del proyecto.**

## 🌍 Entorno de Trabajo

### Configuración Actual - LOCAL
**El sistema actualmente trabaja en LOCAL, NO en apps.movingenia.com**

- **Base de Datos Local:**
  - Host: `192.168.18.230`
  - Usuario: `transito`
  - Password: `transito`
  - Puerto: 5432 (PostgreSQL)
  - Base de datos: `monitoreo`

- **Servidor Local:**
  - Backend API: `http://192.168.18.230:3001`
  - Frontend Dev: `http://192.168.18.230:5173`
  - Ambos servicios se ejecutan con PM2

### Configuración de Red (Histórico - Ya NO se usa)
~~Producción en apps.movingenia.com~~ - **DESCONTINUADO**
- ~~dbsrv.movingenia.com~~ → Ahora usamos `192.168.18.230`
- ~~apps.movingenia.com~~ → Ahora todo es local

## 🔧 Cambiar la IP del Sistema

Para trabajar con otra IP u host, editar los siguientes archivos:

### 1. Backend: `apps/backend/.env`
```bash
DATABASE_HOST=<NUEVA_IP>
DATABASE_URL="postgresql://transito:transito@<NUEVA_IP>:5432/monitoreo?schema=public"
SERVER_URL=http://<NUEVA_IP>:3001
FRONTEND_URL=http://<NUEVA_IP>:5173
CORS_ORIGIN=http://<NUEVA_IP>:5173
```

### 2. Frontend: `apps/frontend/.env`
```bash
VITE_API_URL=http://<NUEVA_IP>:3001/api
VITE_WS_URL=http://<NUEVA_IP>:3001
```

### 3. Reiniciar servicios
```bash
pm2 stop all
cd apps/backend && npm run build
cd ../frontend && npm run build
cd ../..
pm2 restart all
```

## 🔧 Notas Importantes

1. **Entorno actual:** Todo el desarrollo es LOCAL en `192.168.18.230`
2. **NO desplegar a producción:** Ya no se usa apps.movingenia.com ni dbsrv.movingenia.com
3. **Gestión con PM2:** Todos los servicios se administran con PM2
4. **Cambio de IP:** Ver sección anterior para instrucciones de cambio de red

## 📝 Comandos Útiles

### Conexión a Base de Datos Local
```bash
psql -h 192.168.18.230 -U transito -d monitoreo
# Password: transito
```

O con variable de entorno:
```bash
PGPASSWORD=transito psql -h 192.168.18.230 -U transito -d monitoreo
```

### Consultas Comunes
```sql
-- Ver menús existentes
SELECT id, codigo, name, modulo, url, estado FROM menus ORDER BY id;

-- Ver grupos
SELECT id, nombre, descripcion, estado FROM grupos ORDER BY id;

-- Ver permisos de un grupo
SELECT gm.*, m.name as menu_nombre, a.nombre as accion_nombre 
FROM grupos_menus gm
JOIN menus m ON gm.menu_id = m.id
JOIN acciones a ON gm.accion_id = a.id
WHERE gm.grupo_id = 1;
```

## 🏗️ Arquitectura

- **Frontend:** React + TypeScript + Vite
- **Backend:** NestJS + TypeScript
- **Base de Datos:** PostgreSQL 13+
- **ORM:** Prisma
- **Gestor de Procesos:** PM2 (SIEMPRE usar PM2, NO npm run dev directamente)

## 🔧 Gestión de Procesos con PM2

**IMPORTANTE:** En local se administra con PM2, NO iniciar procesos con npm directamente.

```bash
# Ver procesos en ejecución
pm2 status

# Ver logs
pm2 logs

# Reiniciar todos los procesos
pm2 restart all

# Reiniciar un proceso específico
pm2 restart <nombre>

# Detener todos
pm2 stop all

# Iniciar todos
pm2 start ecosystem.config.js
```

El archivo de configuración es `ecosystem.config.js` en la raíz del proyecto.

## ⚠️ Precauciones

- **SIEMPRE usar PM2** para gestionar procesos en local, NO npm run dev
- Siempre confirmar en qué entorno se está trabajando antes de hacer cambios
- Las migraciones deben probarse primero en desarrollo
- Los cambios en producción requieren backup previo
