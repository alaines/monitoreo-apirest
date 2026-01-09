# Configuración del Servidor - 192.168.18.230

## 📡 URLs del Sistema

### Backend (API)
- **URL Base**: http://192.168.18.230:3001/api
- **Swagger Docs**: http://192.168.18.230:3001/api/docs
- **Host**: 0.0.0.0 (escucha en todas las interfaces)
- **Puerto**: 3001 (cambiado de 3000 por conflicto con otro servicio)

### Frontend
- **URL**: http://192.168.18.230:5173
- **Puerto**: 5173

### Base de Datos
- **Host**: 192.168.18.230
- **Puerto**: 5432
- **Database**: monitoreo
- **Usuario**: transito

---

## Nota sobre Puerto 3000

El puerto 3000 está siendo usado por otro servicio (`/home/alaines/parqueape-api/app.js`).
Por esta razón, hemos configurado el backend en el puerto **3001**.

---

## Comandos de Inicio

### Opción 1: Desarrollo con npm
```bash
# Backend
cd /home/alaines/monitoreo-apirest
npm run backend:dev

# Frontend (en otra terminal)
npm run frontend:dev
```

### Opción 2: Desarrollo con variables de entorno explícitas
```bash
# Backend
DATABASE_URL="postgresql://transito:transito@192.168.18.230:5432/monitoreo?schema=public" \
PORT=3000 \
HOST=0.0.0.0 \
SERVER_URL="http://192.168.18.230:3000" \
FRONTEND_URL="http://192.168.18.230:5173" \
JWT_SECRET="my-super-secret-jwt-key-for-development-minimum-32-chars" \
JWT_REFRESH_SECRET="my-super-secret-refresh-key-for-development-minimum-32" \
BCRYPT_ROUNDS=10 \
npm run backend:dev

# Frontend
VITE_API_URL="http://192.168.18.230:3000/api" \
npm run frontend:dev
```

### Opción 3: Docker (Producción)
```bash
docker-compose up -d
```

---

## Configuración de Red

### Firewall
Si el servidor tiene firewall activo, asegurar que los puertos estén abiertos:
```bash
# UFW
sudo ufw allow 3000/tcp
sudo ufw allow 5173/tcp
sudo ufw allow 5432/tcp

# firewalld
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=5173/tcp
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --reload
```

### Acceso desde otras máquinas
Para acceder desde otras máquinas en la red:
1. Asegurar que el servidor escucha en `0.0.0.0` (ya configurado)
2. Abrir puertos en firewall
3. Usar la IP `192.168.18.230` desde otros dispositivos

---

## Verificar Conexión

### Backend
```bash
# Desde el servidor
curl http://192.168.18.230:3000/api/auth/login

# Desde otra máquina en la red
curl http://192.168.18.230:3000/api/auth/login
```

### Frontend
Abrir en navegador: http://192.168.18.230:5173

---

## CORS Configurado

El backend está configurado para aceptar peticiones desde:
- `http://192.168.18.230:5173` (Frontend)
- Credentials habilitado para cookies/tokens

---

## Variables de Entorno Principales

### Backend (.env)
```env
DATABASE_URL=postgresql://transito:transito@192.168.18.230:5432/monitoreo?schema=public
PORT=3000
HOST=0.0.0.0
SERVER_URL=http://192.168.18.230:3000
FRONTEND_URL=http://192.168.18.230:5173
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
```

### Frontend (.env)
```env
VITE_API_URL=http://192.168.18.230:3000/api
```

---

## Troubleshooting

### Backend no responde desde otra máquina
1. Verificar que escucha en `0.0.0.0`: `netstat -tlnp | grep 3000`
2. Verificar firewall: `sudo ufw status` o `sudo firewall-cmd --list-all`
3. Verificar que la IP es correcta: `ip addr show`

### CORS errors
1. Verificar variable `FRONTEND_URL` en backend
2. Verificar que el frontend usa la URL correcta del API
3. Revisar logs del backend para ver origen rechazado

### Base de datos no conecta
1. Verificar que PostgreSQL escucha en IP externa: `netstat -tlnp | grep 5432`
2. Editar `/etc/postgresql/*/main/postgresql.conf`: `listen_addresses = '*'`
3. Editar `/etc/postgresql/*/main/pg_hba.conf`: agregar línea para la red
4. Reiniciar PostgreSQL: `sudo systemctl restart postgresql`

---

## Logs

### Ver logs del backend
```bash
tail -f /home/alaines/monitoreo-apirest/backend.log
```

### Ver logs del frontend
```bash
# Los logs aparecen en la terminal donde se ejecutó npm run frontend:dev
```

---

## Reiniciar Servicios

```bash
# Backend
pkill -f "nest start"
cd /home/alaines/monitoreo-apirest
npm run backend:dev

# Frontend
pkill -f "vite"
npm run frontend:dev
```
