# Guía de Configuración de Red

Esta guía te ayudará a cambiar la configuración de red del sistema para trabajar con diferentes IPs u hosts.

## 📍 Configuración Actual

El sistema está configurado para trabajar en modo local:
- **IP Base de Datos:** `192.168.18.230:5432`
- **IP Backend API:** `192.168.18.230:3001`
- **IP Frontend:** `192.168.18.230:5173`

## 🔄 Cómo Cambiar la IP/Host

### Paso 1: Editar configuración del Backend

Archivo: `apps/backend/.env`

```bash
# Database Configuration
DATABASE_HOST=<NUEVA_IP_O_HOST>
DATABASE_PORT=5432
DATABASE_USER=transito
DATABASE_PASSWORD=transito
DATABASE_NAME=monitoreo
DATABASE_URL="postgresql://transito:transito@<NUEVA_IP_O_HOST>:5432/monitoreo?schema=public"

# JWT Configuration (no cambiar)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRATION=7d
JWT_REFRESH_EXPIRATION=30d
BCRYPT_ROUNDS=10

# Application
NODE_ENV=development
PORT=3001
HOST=0.0.0.0                        # Dejar en 0.0.0.0 para escuchar en todas las interfaces
SERVER_URL=http://<NUEVA_IP>:3001
FRONTEND_URL=http://<NUEVA_IP>:5173

# CORS
CORS_ORIGIN=http://<NUEVA_IP>:5173

# File Upload (no cambiar)
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

### Paso 2: Editar configuración del Frontend

Archivo: `apps/frontend/.env`

```bash
# Frontend Environment Variables

# API URL - debe apuntar al backend
VITE_API_URL=http://<NUEVA_IP>:3001/api

# WebSocket URL (sin /api)
VITE_WS_URL=http://<NUEVA_IP>:3001
```

### Paso 3: Si usas build de producción

Archivo: `apps/frontend/.env.production`

```bash
# Frontend Production Environment Variables
VITE_API_URL=http://<NUEVA_IP>:3001/api
VITE_WS_URL=http://<NUEVA_IP>:3001
```

### Paso 4: Reiniciar servicios

```bash
# 1. Detener servicios
pm2 stop all

# 2. Recompilar backend
cd /home/alaines/monitoreo-apirest/apps/backend
npm run build

# 3. Recompilar frontend (importante: las variables VITE_* se leen en tiempo de build)
cd ../frontend
npm run build

# 4. Volver a raíz
cd /home/alaines/monitoreo-apirest

# 5. Reiniciar servicios
pm2 restart all

# 6. Verificar estado
pm2 status
pm2 logs --lines 50
```

## 📋 Ejemplos de Configuración

### Ejemplo 1: Cambiar a 192.168.1.100

**Backend (.env):**
```bash
DATABASE_HOST=192.168.1.100
DATABASE_URL="postgresql://transito:transito@192.168.1.100:5432/monitoreo?schema=public"
SERVER_URL=http://192.168.1.100:3001
FRONTEND_URL=http://192.168.1.100:5173
CORS_ORIGIN=http://192.168.1.100:5173
```

**Frontend (.env):**
```bash
VITE_API_URL=http://192.168.1.100:3001/api
VITE_WS_URL=http://192.168.1.100:3001
```

### Ejemplo 2: Usar localhost

**Backend (.env):**
```bash
DATABASE_HOST=localhost
DATABASE_URL="postgresql://transito:transito@localhost:5432/monitoreo?schema=public"
SERVER_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

**Frontend (.env):**
```bash
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
```

### Ejemplo 3: Usar dominio personalizado

**Backend (.env):**
```bash
DATABASE_HOST=db.miempresa.local
DATABASE_URL="postgresql://transito:transito@db.miempresa.local:5432/monitoreo?schema=public"
SERVER_URL=http://app.miempresa.local:3001
FRONTEND_URL=http://app.miempresa.local:5173
CORS_ORIGIN=http://app.miempresa.local:5173
```

**Frontend (.env):**
```bash
VITE_API_URL=http://app.miempresa.local:3001/api
VITE_WS_URL=http://app.miempresa.local:3001
```

## ✅ Verificación

Después de cambiar la configuración, verifica que todo funcione:

### 1. Verificar Backend
```bash
# Verificar que el backend responde
curl http://<NUEVA_IP>:3001/api/health

# Debería responder algo como:
# {"status":"ok","timestamp":"2026-03-30T..."}
```

### 2. Verificar conexión a Base de Datos
```bash
# Probar conexión desde terminal
PGPASSWORD=transito psql -h <NUEVA_IP> -U transito -d monitoreo -c "SELECT version();"

# Debería mostrar la versión de PostgreSQL
```

### 3. Verificar Frontend
Abrir en navegador:
```
http://<NUEVA_IP>:5173
```

Deberías ver la página de login del sistema.

### 4. Verificar WebSockets
En la consola del navegador (F12), deberías ver:
```
WebSocket connection established
```

Si ves errores de CORS, verifica que `CORS_ORIGIN` en backend coincida con la URL del frontend.

### 5. Verificar logs de PM2
```bash
pm2 logs

# Ver errores específicos
pm2 logs monitoreo-backend --err
pm2 logs monitoreo-frontend --err
```

## 🔧 Solución de Problemas

### Problema: Error CORS
**Síntoma:** En consola del navegador ves errores como "Access-Control-Allow-Origin"

**Solución:**
1. Verifica que `CORS_ORIGIN` en `apps/backend/.env` tenga la URL correcta del frontend
2. Reinicia el backend: `pm2 restart monitoreo-backend`

### Problema: No conecta a la base de datos
**Síntoma:** Error "ECONNREFUSED" o "Connection timeout"

**Solución:**
1. Verifica que PostgreSQL esté corriendo: `sudo systemctl status postgresql`
2. Verifica que la IP/host sea accesible: `ping <NUEVA_IP>`
3. Verifica las credenciales en el .env
4. Verifica que PostgreSQL permita conexiones desde tu IP en `pg_hba.conf`

### Problema: Frontend no carga datos
**Síntoma:** La página carga pero no muestra datos, error 404 en Network tab

**Solución:**
1. Verifica que `VITE_API_URL` esté correcto
2. **IMPORTANTE:** Recompila el frontend después de cambiar variables VITE_*
   ```bash
   cd apps/frontend
   npm run build
   pm2 restart monitoreo-frontend
   ```

### Problema: WebSocket no conecta
**Síntoma:** Notificaciones en tiempo real no funcionan

**Solución:**
1. Verifica que `VITE_WS_URL` esté correcto (sin `/api` al final)
2. Recompila el frontend
3. Verifica en el navegador (F12 → Network → WS) que intente conectar a la URL correcta

## 📝 Notas Importantes

1. **Variables VITE_***: Estas variables son leídas en tiempo de BUILD del frontend, no en tiempo de ejecución. Por eso es crucial recompilar el frontend después de cambiarlas.

2. **CORS_ORIGIN**: Debe coincidir exactamente con la URL desde donde accedes al frontend (incluir http:// o https://).

3. **HOST=0.0.0.0**: En la configuración del backend, dejar HOST en 0.0.0.0 permite que el servidor escuche en todas las interfaces de red.

4. **Firewall**: Asegúrate de que los puertos 3001 (backend) y 5173 (frontend) estén abiertos en el firewall.

5. **PostgreSQL**: Si cambias el host de la base de datos, asegúrate de que PostgreSQL esté configurado para aceptar conexiones desde la nueva IP (archivo `postgresql.conf` y `pg_hba.conf`).

## 🚀 Configuración para Producción con Nginx

Si quieres servir todo desde un solo puerto usando Nginx como proxy reverso:

### 1. Instalar Nginx
```bash
sudo apt install nginx
```

### 2. Configurar Nginx
Crear archivo: `/etc/nginx/sites-available/monitoreo`

```nginx
server {
    listen 80;
    server_name <TU_DOMINIO_O_IP>;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 3. Activar configuración
```bash
sudo ln -s /etc/nginx/sites-available/monitoreo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Actualizar .env para usar Nginx
**Backend (.env):**
```bash
CORS_ORIGIN=http://<TU_IP>
```

**Frontend (.env):**
```bash
VITE_API_URL=http://<TU_IP>/api
VITE_WS_URL=http://<TU_IP>
```

Con esta configuración, todo se accede desde el puerto 80 (sin especificar puerto).
