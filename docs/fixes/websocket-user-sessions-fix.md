# Fix: WebSocket No Creaba Registros en user_sessions

## Fecha
2026-01-08

## Problema Reportado
Cuando los usuarios se logueaban en producción (http://apps.movingenia.com), no se estaban creando registros en la tabla `user_sessions`, a pesar de que el sistema de notificaciones WebSocket estaba implementado correctamente en el código.

## Diagnóstico

### 1. Verificación de Backend
- El código de `NotificationsGateway` estaba correcto
- El método `handleConnection()` creaba registros en `user_sessions`
- La tabla `user_sessions` existía con la estructura correcta
- El ownership de la tabla era correcto (`transito`)
- Prisma Client estaba actualizado

### 2. Prueba Directa de WebSocket
Se realizó una prueba conectando directamente al WebSocket:
```bash
node -e "
const io = require('socket.io-client');
const socket = io('http://localhost:3001/notifications', {
  auth: { token: 'valid-jwt-token' },
  transports: ['websocket'],
});
"
```
**Resultado**: La conexión funcionó y creó el registro en `user_sessions`

### 3. Problemas Encontrados

#### 3.1 Configuración de Nginx Incorrecta
**Archivo**: `/etc/nginx/sites-available/alertas-web`

**Problema 1**: El proxy del API apuntaba a una dirección incorrecta
```nginx
# ANTES (Incorrecto)
location /api/ {
    proxy_pass http://34.66.18.138:3000/;
}
```

**Problema 2**: No había configuración para el proxy de WebSocket
- Faltaba `location /socket.io/` para manejar las conexiones WebSocket

**Problema 3**: Configuración duplicada
- Existía un archivo `/etc/nginx/sites-enabled/monitoreo` obsoleto
- Ambos archivos tenían `server_name apps.movingenia.com`
- Creaba conflictos de enrutamiento

#### 3.2 Variables de Entorno del Frontend
**Archivo**: `apps/frontend/.env.production`

**Problema**: Las URLs estaban configuradas con el puerto directo:
```env
# ANTES (Incorrecto)
VITE_API_URL=http://apps.movingenia.com:3001/api
VITE_WS_URL=http://apps.movingenia.com:3001
```

Esto causaba que el frontend intentara conectarse directamente al puerto 3001, evitando el proxy de Nginx.

#### 3.3 Modo de Ejecución
**Archivo**: `ecosystem.config.js`

**Problema**: El backend estaba configurado para correr en modo desarrollo:
```javascript
// ANTES (Incorrecto)
args: 'run dev',
env: {
  NODE_ENV: 'development',
}
```

Esto causaba problemas de logging y rendimiento.

## Solución Implementada

### 1. Actualización de Nginx

#### Paso 1: Eliminar configuración obsoleta
```bash
sudo rm -f /etc/nginx/sites-enabled/monitoreo
```

#### Paso 2: Actualizar configuración de alertas-web
```nginx
server {
    listen 80;
    server_name apps.movingenia.com;  
    root /var/www/alertas-web;
    
    # WebSocket Proxy - Socket.IO
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts largos para WebSocket
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # API Proxy - Backend corregido
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        # ... otros headers
    }
    
    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Paso 3: Recargar Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 2. Actualización de Variables de Entorno

**Archivo**: `apps/frontend/.env.production`
```env
# CORRECTO
VITE_API_URL=http://apps.movingenia.com/api
VITE_WS_URL=http://apps.movingenia.com
```

### 3. Reconstrucción del Frontend
```bash
cd ~/monitoreo-apirest/apps/frontend
npm run build
sudo rm -rf /var/www/alertas-web/*
sudo cp -r dist/* /var/www/alertas-web/
sudo chown -R www-data:www-data /var/www/alertas-web/
```

### 4. Actualización de ecosystem.config.js
```javascript
// CORRECTO
{
  name: 'monitoreo-backend',
  args: 'run start:prod',
  env: {
    NODE_ENV: 'production',
  }
}
```

### 5. Reinicio de PM2
```bash
cd ~/monitoreo-apirest
pm2 reload ecosystem.config.js --update-env
```

## Verificación

### 1. Prueba de WebSocket a través de Nginx
```bash
node << 'EOF'
const io = require('socket.io-client');
const socket = io('http://apps.movingenia.com/notifications', {
  auth: { token: 'valid-jwt-token' },
});

socket.on('connect', () => {
  console.log('Conectado!', socket.id);
});
EOF
```

**Resultado**: Conexión exitosa a través de Nginx

### 2. Verificación de Registros en Base de Datos
```sql
SELECT id, user_id, socket_id, connected_at, is_active 
FROM user_sessions 
ORDER BY connected_at DESC;
```

**Resultado**: Registros creados correctamente

```
 id | user_id |      socket_id       |      connected_at       | is_active 
----+---------+----------------------+-------------------------+-----------
  2 |      27 | MoANzgvuaTkkHogbAAAF | 2026-01-08 06:36:51.836 | f
```

## Archivos Actualizados

### En el Repositorio Local
1. `ecosystem.config.js` - Cambiado a modo producción
2. `apps/frontend/.env.production` - URLs corregidas
3. `config/nginx/alertas-web.conf` - Configuración de Nginx documentada

### En Producción
1. `/etc/nginx/sites-available/alertas-web` - Configuración actualizada
2. `/etc/nginx/sites-enabled/monitoreo` - Eliminado
3. `/var/www/alertas-web/*` - Frontend reconstruido con URLs correctas

## Lecciones Aprendidas

1. **Proxy de WebSocket**: Nginx requiere configuración específica para WebSocket:
   - `proxy_http_version 1.1`
   - `proxy_set_header Upgrade $http_upgrade`
   - `proxy_set_header Connection "upgrade"`
   - Timeouts largos (7d para WebSocket)

2. **Variables de Entorno**: En producción con Nginx como proxy, las URLs no deben incluir puertos directos

3. **Debugging de WebSocket**: Probar primero la conexión directa, luego a través del proxy

4. **PM2 Logging**: Los logs de NestJS en modo producción no siempre se capturan en los archivos de PM2

## Estado Final
**RESUELTO**: El WebSocket ahora funciona correctamente a través de Nginx y crea registros en `user_sessions` cuando los usuarios se conectan.

## Referencias
- [Socket.IO with Nginx](https://socket.io/docs/v4/reverse-proxy/#nginx)
- [NestJS WebSocket Gateway](https://docs.nestjs.com/websockets/gateways)
- [Nginx WebSocket Proxying](http://nginx.org/en/docs/http/websocket.html)
