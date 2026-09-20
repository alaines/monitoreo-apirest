# MANUAL DE INSTALACIÓN Y DESPLIEGUE
## Sistema de Control y Monitoreo de Intersecciones Semafóricas e Incidencias
**Versión del Sistema**: v1.2.0  
**Arquitectura**: Monorepo (NestJS Backend + React Vite Frontend + PostgreSQL PostGIS)  
**Fecha de Actualización**: Septiembre 2026  

---

## 1. Requisitos del Sistema y Prerrequisitos

### 1.1. Servidor de Producción / Desarrollo
| Componente | Mínimo Recomendado | Producción Óptima |
|---|---|---|
| **Sistema Operativo** | Ubuntu 20.04 / 22.04 LTS / Debian 12 / Windows 11 WSL2 | Ubuntu 22.04 LTS x64 |
| **CPU** | 2 Cores | 4 Cores o superior |
| **Memoria RAM** | 4 GB RAM | 8 GB - 16 GB RAM |
| **Almacenamiento** | 20 GB SSD | 50 GB - 100 GB SSD NVMe |
| **Motor de Base de Datos** | PostgreSQL 13+ con extensión PostGIS | PostgreSQL 15+ PostGIS |
| **Entorno de Ejecución** | Node.js 18.x o 20.x LTS y NPM 9+ | Docker 24+ y Docker Compose v2 |

---

## 2. Método 1: Despliegue con Docker Compose (Recomendado)

Docker Compose proporciona un entorno aislado, preconfigurado y reproducible en minutos.

### 2.1. Estructura de Servicios Docker
- `monitoreo-db`: Contenedor PostgreSQL 15 con PostGIS 3.3 (Puerto interno 5432).
- `monitoreo-backend`: Contenedor Node.js 20 con NestJS API REST (Puerto expuesto 3000).
- `monitoreo-frontend`: Contenedor Node.js 20 con servidor de aplicación Vite/React (Puerto expuesto 5173).
- `control_center_pgadmin`: Interfaz web opcional para gestión de la base de datos (Puerto expuesto 5050).

### 2.2. Paso a Paso de Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/alaines/monitoreo-apirest.git
cd monitoreo-apirest

# 2. Configurar variables de entorno
cp .env.example .env
```

Verifique los valores de `.env`:
```env
DATABASE_USER=transito
DATABASE_PASSWORD=transito
DATABASE_NAME=protransito
DATABASE_PORT=5432
DATABASE_URL=postgresql://transito:transito@postgres:5432/protransito?schema=public

JWT_SECRET=tu-clave-secreta-jwt-de-minimo-32-caracteres
JWT_REFRESH_SECRET=tu-clave-refresh-secreta-minimo-32-caracteres
JWT_EXPIRES_IN=7d

PORT=3000
HOST=0.0.0.0
NODE_ENV=development
SERVER_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000/api
```

```bash
# 3. Levantar los contenedores en segundo plano
docker-compose up -d --build

# 4. Restaurar la base de datos desde el último backup (carpeta backups/)
docker cp backups/protransito_2026-09-19.sql monitoreo-db:/tmp/backup.sql
docker exec -it monitoreo-db psql -U transito -d protransito -f /tmp/backup.sql

# 5. Generar cliente Prisma dentro del contenedor backend
docker exec monitoreo-backend npx prisma generate

# 6. Compilar frontend para verificar cero errores
docker exec monitoreo-frontend npm run build

# 7. Reiniciar servicios
docker restart monitoreo-backend monitoreo-frontend
```

---

## 3. Método 2: Instalación Local / Producción con PM2 (Sin Docker)

### 3.1. Instalación de Dependencias del Sistema
```bash
# Ubuntu / Debian:
sudo apt update && sudo apt install -y curl git postgresql postgresql-contrib postgis

# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 3.2. Configuración de PostgreSQL y PostGIS
```bash
sudo -u postgres psql
```
```sql
CREATE USER transito WITH PASSWORD 'transito';
CREATE DATABASE protransito OWNER transito;
\c protransito
CREATE EXTENSION IF NOT EXISTS postgis;
\q
```

### 3.3. Instalación de Paquetes del Monorepo
```bash
cd monitoreo-apirest
npm install

# Generar cliente de Prisma
npm run prisma:generate

# Restaurar la base de datos
psql -U transito -d protransito -f backups/protransito_2026-09-19.sql
```

### 3.4. Ejecución de Servicios con PM2
```bash
# Iniciar servicios definidos en ecosystem.config.js
npm run dev

# Comandos útiles:
pm2 status          # Ver estado de los procesos
pm2 logs            # Ver logs combinados en vivo
pm2 restart all     # Reiniciar todos los servicios
```

---

## 4. Configuración de Red, Servidor Web Nginx y SSL

Para entornos en servidor dedicado o VPS institucional:

### 4.1. Configuración de Nginx Reverse Proxy
Cree el archivo `/etc/nginx/sites-available/monitoreo`:
```nginx
server {
    listen 80;
    server_name monitoreo.tudominio.gob.pe;

    # Frontend (React App)
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API REST
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSockets (Socket.IO para presencia y notificaciones)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
# Habilitar sitio y recargar Nginx
sudo ln -s /etc/nginx/sites-available/monitoreo /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 4.2. Cambio Dinámico de IP del Servidor
Si la IP del servidor cambia, ejecute el script automatizado:
```bash
./scripts/restart-with-new-ip.sh
```

---

## 5. Verificación de la Instalación
1. Acceda a `http://localhost:5173` o dominio asignado.
2. Compruebe la respuesta de la API REST en `http://localhost:3000/api/incidents/statistics`.
3. Verifique la documentación Swagger en `http://localhost:3000/api/docs`.
4. Ingrese con las credenciales maestras por defecto (`admin` / `Admin123`).
