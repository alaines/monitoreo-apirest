# Resumen de Despliegue - Sistema de Monitoreo

## Despliegue Completado Exitosamente

**Fecha**: 31 de Diciembre de 2024, 22:55 UTC  
**Servidor**: apps.movingenia.com (34.66.199.6)

---

## URLs del Sistema

| Servicio | URL | Estado |
|----------|-----|--------|
| **Frontend** | http://apps.movingenia.com | Funcionando |
| **Backend API** | http://apps.movingenia.com/api | Funcionando |

---

## Base de Datos

- **Host**: dbsrv.movingenia.com (34.66.199.6)
- **Motor**: PostgreSQL 13+ con PostGIS 3.4
- **Base de datos**: `monitoreo`
- **Usuario**: `transito`
- **Password**: `transito`

### Datos Migrados
- **809 cruces**
- **1,545 tickets**
- **20 usuarios**
- **5 administradores**

---

## Arquitectura Desplegada

```
Internet
    ↓
[Nginx :80] (Reverse Proxy)
    ↓
    ├─→ Frontend (localhost:5173) - React + Vite
    └─→ Backend API (localhost:3001) - NestJS
            ↓
    [PostgreSQL] dbsrv.movingenia.com:5432
```

---

## Componentes

### Frontend
- **Framework**: React + TypeScript + Vite
- **Puerto interno**: 5173
- **Directorio**: ~/monitoreo-apirest/apps/frontend
- **Proceso PM2**: `monitoreo-frontend`
- **Estado**: Online

### Backend
- **Framework**: NestJS + Prisma
- **Puerto interno**: 3001
- **Directorio**: ~/monitoreo-apirest/apps/backend
- **Proceso PM2**: `monitoreo-backend`
- **Estado**: Online

### Nginx
- **Puerto**: 80
- **Configuración**: `/etc/nginx/sites-available/monitoreo`
- **Estado**: Active

---

## Acceso al Servidor

### SSH
```bash
ssh -i /ruta/a/clave/privada daddyplayerperu@apps.movingenia.com
```

### Gestión de Servicios PM2

Ver estado:
```bash
pm2 status
```

Ver logs:
```bash
pm2 logs                    # Todos los logs
pm2 logs monitoreo-backend  # Solo backend
pm2 logs monitoreo-frontend # Solo frontend
```

Reiniciar servicios:
```bash
pm2 restart all              # Todos
pm2 restart monitoreo-backend   # Solo backend
pm2 restart monitoreo-frontend  # Solo frontend
```

Parar/Iniciar:
```bash
pm2 stop all
pm2 start ecosystem.config.js
```

Guardar configuración:
```bash
pm2 save
```

---

## Archivos de Configuración

### Variables de Entorno
**Archivo**: `~/monitoreo-apirest/.env`
```env
DATABASE_URL="postgresql://transito:transito@dbsrv.movingenia.com:5432/monitoreo?schema=public"
JWT_SECRET=monitoreo_secret_key_2025_production_secure
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
VITE_API_URL=http://apps.movingenia.com/api
```

### PM2
**Archivo**: `~/monitoreo-apirest/ecosystem.config.js`

### Nginx
**Archivo**: `/etc/nginx/sites-available/monitoreo`

### Vite
**Archivo**: `~/monitoreo-apirest/apps/frontend/vite.config.ts`

---

## Mantenimiento

### Actualizar la Aplicación
```bash
cd ~/monitoreo-apirest

# Si usas Git
git pull

# Rebuild backend
cd apps/backend
npm run build

# Reiniciar servicios
cd ../..
pm2 restart all
```

### Backup de Base de Datos
```bash
# Desde el servidor de aplicación
PGPASSWORD='transito' pg_dump -h dbsrv.movingenia.com \
  -U transito monitoreo > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Ver Logs de Nginx
```bash
sudo tail -f /var/log/nginx/monitoreo-access.log
sudo tail -f /var/log/nginx/monitoreo-error.log
```

---

## Verificación del Sistema

### Test de Conectividad
```bash
# Frontend
curl -I http://apps.movingenia.com/
# Debe retornar: HTTP/1.1 200 OK

# Backend API
curl -I http://apps.movingenia.com/api/tipos
# Debe retornar: HTTP/1.1 200 OK

# Test de endpoint de login
curl -X POST http://apps.movingenia.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"usuario":"admin","password":"Admin123"}'
```

### Verificar Servicios
```bash
# PM2
pm2 status

# Nginx
sudo systemctl status nginx

# Puertos
lsof -i:80,3001,5173
```

---

## 🐛 Troubleshooting

### Backend no responde (502 Bad Gateway)
```bash
# Ver logs
pm2 logs monitoreo-backend --lines 50

# Verificar que esté escuchando en puerto 3001
lsof -i:3001

# Reiniciar
pm2 restart monitoreo-backend
```

### Frontend no carga
```bash
# Ver logs
pm2 logs monitoreo-frontend --lines 50

# Verificar que esté escuchando en puerto 5173
lsof -i:5173

# Reiniciar
pm2 restart monitoreo-frontend
```

### Error de conexión a base de datos
```bash
# Verificar conectividad
PGPASSWORD='transito' psql -h dbsrv.movingenia.com \
  -U transito -d monitoreo -c 'SELECT 1;'

# Verificar que el .env esté en el directorio correcto
ls -la ~/monitoreo-apirest/apps/backend/.env
```

### Nginx no inicia
```bash
# Test de configuración
sudo nginx -t

# Ver logs de error
sudo journalctl -u nginx -n 50

# Reiniciar
sudo systemctl restart nginx
```

---

## 📊 Recursos del Sistema

### Uso Actual (según PM2)
- **Backend**: ~121 MB RAM
- **Frontend**: ~74 MB RAM
- **Total**: ~195 MB RAM

### Puertos Utilizados
- **80**: Nginx (HTTP público)
- **3001**: Backend API (interno)
- **5173**: Frontend Vite (interno)
- **5432**: PostgreSQL (remoto)

---

## 📝 Notas Importantes

1. **Enlaces Simbólicos**: Los archivos `.env` en `apps/backend` y `apps/frontend` son enlaces simbólicos al `.env` raíz
2. **Modo Desarrollo**: El sistema está corriendo en modo desarrollo (`npm run dev`) para facilitar el desarrollo
3. **Inicio Automático**: PM2 está configurado para iniciar automáticamente con el sistema
4. **Seguridad**: Backend y Frontend escuchan solo en localhost; Nginx maneja las peticiones externas

---

## Tareas Completadas

- [x] Migración de base de datos (192.168.18.230 → dbsrv.movingenia.com)
- [x] Creación de usuario `transito` en PostgreSQL
- [x] Restauración de 809 cruces y 1,545 tickets
- [x] Transferencia de proyecto vía SSH (22MB)
- [x] Instalación de dependencias npm
- [x] Generación de Prisma Client
- [x] Instalación y configuración de PM2
- [x] Configuración de Nginx como reverse proxy
- [x] Creación de enlaces simbólicos para .env
- [x] Compilación del backend (webpack)
- [x] Configuración de Vite para permitir dominio externo
- [x] Inicio de servicios con PM2
- [x] Configuración de PM2 startup automático
- [x] Verificación de conectividad (Frontend + Backend)
- [x] Creación de documentación de despliegue

---

## 📞 Información de Contacto

**Servidor**: apps.movingenia.com  
**Usuario SSH**: daddyplayerperu  
**Documentación en servidor**: ~/DEPLOYMENT_INFO.md

---

## 🎉 Próximos Pasos

1. Acceder a http://apps.movingenia.com desde un navegador
2. Iniciar sesión con las credenciales de usuario
3. Verificar que los datos migrados sean visibles
4. Probar todas las funcionalidades del sistema
5. Configurar certificado SSL/HTTPS (opcional pero recomendado)

---

**Estado Final**: Sistema completamente desplegado y operativo
