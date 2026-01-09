# Guía de Instalación - Sistema de Monitoreo

## Tabla de Contenidos
1. [Requisitos Previos](#requisitos-previos)
2. [Instalación Rápida (Desarrollo)](#instalación-rápida-desarrollo)
3. [Instalación en Producción](#instalación-en-producción)
4. [Configuración de Base de Datos](#configuración-de-base-de-datos)
5. [Variables de Entorno](#variables-de-entorno)
6. [Verificación](#verificación)
7. [Solución de Problemas](#solución-de-problemas)

---

## Requisitos Previos

### Software Requerido
- **Node.js**: v18 o superior (recomendado v20)
- **PostgreSQL**: 13 o superior con extensión PostGIS 3.4+
- **npm**: v9 o superior
- **Git**: Para clonar el repositorio

### Para Producción Adicional
- **PM2**: Gestor de procesos Node.js
- **Nginx**: Servidor web / reverse proxy (opcional pero recomendado)

### Verificar Instalaciones
```bash
node --version    # Debe ser v18+
npm --version     # Debe ser v9+
psql --version    # Debe ser 13+
```

---

## Instalación Rápida (Desarrollo)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/alaines/monitoreo-apirest.git
cd monitoreo-apirest
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Base de Datos

#### 3.1 Crear Base de Datos
```bash
# Conectar a PostgreSQL
sudo -u postgres psql

# Dentro de psql:
CREATE DATABASE monitoreo;
CREATE USER transito WITH PASSWORD 'transito';
GRANT ALL PRIVILEGES ON DATABASE monitoreo TO transito;

# Habilitar extensión PostGIS
\c monitoreo
CREATE EXTENSION IF NOT EXISTS postgis;
GRANT ALL ON SCHEMA public TO transito;

\q
```

#### 3.2 Aplicar Schema y Datos Iniciales
```bash
# Aplicar estructura de base de datos
psql -U transito -d monitoreo -f database/current-schema.sql

# Cargar datos iniciales (usuario admin y catálogos)
psql -U transito -d monitoreo -f database/init.sql
```

### 4. Configurar Variables de Entorno
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus valores
nano .env
```

**Configuración mínima para desarrollo:**
```env
# Base de Datos
DATABASE_URL=postgresql://transito:transito@localhost:5432/monitoreo?schema=public

# JWT Secrets (cambiar en producción)
JWT_SECRET=mi-secreto-super-seguro-minimo-32-caracteres
JWT_REFRESH_SECRET=mi-refresh-secreto-super-seguro-minimo-32-caracteres
JWT_EXPIRES_IN=7d

# Backend
PORT=3001
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3001/api
```

### 5. Generar Prisma Client
```bash
cd apps/backend
npx prisma generate
cd ../..
```

### 6. Iniciar en Modo Desarrollo
```bash
# En una terminal: Backend
npm run backend:dev

# En otra terminal: Frontend
npm run frontend:dev
```

### 7. Acceder al Sistema
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Swagger Docs**: http://localhost:3001/api/docs

**Credenciales iniciales:**
- Usuario: `admin`
- Contraseña: `Admin123`

**¡Cambiar la contraseña después del primer login!**

---

## 🏭 Instalación en Producción

### Script de Instalación Automática
```bash
# Ejecutar script de instalación
chmod +x scripts/install-production.sh
sudo ./scripts/install-production.sh
```

### O Instalación Manual:

#### 1. Preparar el Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL 13+ con PostGIS
sudo apt install -y postgresql postgresql-contrib postgis

# Instalar PM2
sudo npm install -g pm2

# Instalar Nginx (opcional)
sudo apt install -y nginx
```

#### 2. Configurar Base de Datos en Producción

```bash
# Crear usuario y base de datos
sudo -u postgres psql << EOF
CREATE DATABASE monitoreo;
CREATE USER transito WITH PASSWORD 'contraseña-segura-aqui';
GRANT ALL PRIVILEGES ON DATABASE monitoreo TO transito;
\c monitoreo
CREATE EXTENSION IF NOT EXISTS postgis;
GRANT ALL ON SCHEMA public TO transito;
EOF

# Aplicar schema
PGPASSWORD='contraseña-segura-aqui' psql -h localhost -U transito -d monitoreo -f database/current-schema.sql

# Cargar datos iniciales
PGPASSWORD='contraseña-segura-aqui' psql -h localhost -U transito -d monitoreo -f database/init.sql
```

#### 3. Clonar y Configurar Proyecto

```bash
# Clonar en directorio home del usuario
cd ~
git clone https://github.com/alaines/monitoreo-apirest.git
cd monitoreo-apirest

# Instalar dependencias
npm install

# Configurar variables de entorno
cat > .env << 'EOF'
# Base de Datos
DATABASE_URL=postgresql://transito:contraseña-segura@localhost:5432/monitoreo?schema=public

# JWT Secrets - CAMBIAR ESTOS VALORES
JWT_SECRET=produccion-secret-key-super-seguro-minimo-32-caracteres-$(openssl rand -hex 16)
JWT_REFRESH_SECRET=produccion-refresh-secret-super-seguro-minimo-32-$(openssl rand -hex 16)
JWT_EXPIRES_IN=7d

# Backend
PORT=3001
NODE_ENV=production

# Frontend
VITE_API_URL=http://tu-dominio.com/api
EOF

# Generar Prisma Client
cd apps/backend
npx prisma generate
cd ../..
```

#### 4. Compilar Aplicación

```bash
# Backend
cd apps/backend
npm run build
cd ../..

# Frontend
cd apps/frontend
npm run build
cd ../..
```

#### 5. Configurar PM2

```bash
# Crear archivo de configuración PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'monitoreo-backend',
      script: 'apps/backend/dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'monitoreo-frontend',
      script: 'npx',
      args: 'vite preview --port 5173 --host 0.0.0.0',
      cwd: './apps/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
EOF

# Crear directorio de logs
mkdir -p logs

# Iniciar servicios
pm2 start ecosystem.config.js

# Guardar configuración
pm2 save

# Configurar inicio automático
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

# Verificar estado
pm2 status
```

#### 6. Configurar Nginx (Opcional pero Recomendado)

```bash
# Crear configuración de Nginx
sudo nano /etc/nginx/sites-available/monitoreo
```

**Contenido del archivo:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket para Socket.io
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/monitoreo /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## Configuración de Base de Datos

### Estructura Básica
El sistema requiere estas tablas principales:
- `usuarios` - Usuarios del sistema
- `estados` - Estados de tickets (PENDIENTE, EN_PROCESO, RESUELTO)
- `prioridades` - Niveles de prioridad (BAJA, MEDIA, ALTA, CRÍTICA)
- `tipos` - Tipos de elementos (semáforos, cruces, etc.)
- `incidencias` - Tipos de incidencias
- `cruces` - Cruces/intersecciones (con coordenadas PostGIS)
- `tickets` - Tickets de incidencias
- `administradores` - Entidades administradoras
- `equipos` - Equipos de trabajo

### Script de Inicialización
El archivo `database/init.sql` incluye:
- Usuario administrador inicial (admin/Admin123)
- Estados y prioridades base
- Catálogo de tipos jerárquico
- Incidencias comunes
- Datos de ejemplo opcionales

### Resetear Base de Datos
```bash
# CUIDADO: Esto eliminará todos los datos
psql -U transito -d monitoreo -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO transito;"
psql -U transito -d monitoreo -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -U transito -d monitoreo -f database/current-schema.sql
psql -U transito -d monitoreo -f database/init.sql
```

---

## Variables de Entorno

### Archivo `.env` Completo

```env
# ============================================
# BASE DE DATOS
# ============================================
DATABASE_URL=postgresql://usuario:password@host:5432/monitoreo?schema=public

# ============================================
# SEGURIDAD - JWT
# ============================================
# Generar con: openssl rand -base64 32
JWT_SECRET=tu-secreto-super-seguro-minimo-32-caracteres
JWT_REFRESH_SECRET=tu-refresh-secreto-super-seguro-minimo-32
JWT_EXPIRES_IN=7d

# ============================================
# BACKEND
# ============================================
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
SERVER_URL=http://tu-dominio.com
FRONTEND_URL=http://tu-dominio.com

# ============================================
# FRONTEND
# ============================================
VITE_API_URL=http://tu-dominio.com/api

# ============================================
# BCRYPT (Opcional)
# ============================================
BCRYPT_ROUNDS=10

# ============================================
# CORS (Opcional)
# ============================================
CORS_ORIGIN=http://tu-dominio.com
```

### Generar Secrets Seguros
```bash
# Para JWT_SECRET
openssl rand -base64 32

# Para JWT_REFRESH_SECRET
openssl rand -base64 32

# O usar:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Verificación

### Verificar Backend
```bash
# Desde el servidor
curl http://localhost:3001/api/tipos

# Desde exterior (si Nginx está configurado)
curl http://tu-dominio.com/api/tipos
```

### Verificar Frontend
```bash
# Desde navegador
http://tu-dominio.com
```

### Verificar Base de Datos
```bash
psql -U transito -d monitoreo -c "SELECT COUNT(*) FROM usuarios;"
psql -U transito -d monitoreo -c "SELECT COUNT(*) FROM tipos;"
psql -U transito -d monitoreo -c "SELECT COUNT(*) FROM incidencias;"
```

### Verificar PM2
```bash
pm2 status
pm2 logs --lines 50
```

### Verificar Nginx
```bash
sudo systemctl status nginx
sudo nginx -t
```

---

## Solución de Problemas

### Backend no inicia
```bash
# Ver logs
pm2 logs monitoreo-backend --lines 100

# Verificar que el puerto esté libre
lsof -i:3001

# Verificar conexión a base de datos
psql -U transito -d monitoreo -c "SELECT 1;"
```

### Frontend no carga
```bash
# Ver logs
pm2 logs monitoreo-frontend --lines 100

# Verificar que el puerto esté libre
lsof -i:5173

# Rebuild
cd apps/frontend
npm run build
pm2 restart monitoreo-frontend
```

### Error de conexión a base de datos
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar credenciales
psql -U transito -d monitoreo -c "SELECT current_user;"

# Ver logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

### 502 Bad Gateway (Nginx)
```bash
# Verificar que los servicios estén corriendo
pm2 status

# Verificar configuración de Nginx
sudo nginx -t

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
```

### Error "Blocked request" en Vite
Asegurarse que `vite.config.ts` incluya:
```typescript
server: {
  host: '0.0.0.0',
  port: 5173,
  allowedHosts: [
    'tu-dominio.com',
    'localhost'
  ]
}
```

---

## Documentación Adicional

- **Guía Rápida**: [docs/guides/GUIA-RAPIDA.md](./guides/GUIA-RAPIDA.md)
- **Arquitectura**: [docs/architecture/SERVER-CONFIG.md](./architecture/SERVER-CONFIG.md)
- **API**: http://tu-dominio.com/api/docs (Swagger)

---

## 🆘 Soporte

Para problemas o preguntas:
1. Revisar [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Verificar logs de PM2: `pm2 logs`
3. Revisar logs de Nginx: `sudo tail -f /var/log/nginx/error.log`
4. Abrir un issue en GitHub

---

## Notas de Seguridad

1. **Cambiar contraseñas por defecto**
   - Usuario: admin/Admin123
   - Base de datos: transito/transito

2. **Generar JWT secrets únicos** usando `openssl rand -base64 32`

3. **Configurar HTTPS** en producción (recomendado usar Let's Encrypt)

4. **Configurar firewall** (UFW o firewalld)
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```

5. **Backup regular** de base de datos
   ```bash
   pg_dump -U transito monitoreo > backup_$(date +%Y%m%d).sql
   ```
