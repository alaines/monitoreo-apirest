# Guía de Deployment a Producción

## 📋 Pre-requisitos

Antes de ejecutar el deployment, asegúrate de tener:

1. **Acceso SSH** configurado al servidor `apps.movingenia.com`
2. **DNS** configurado apuntando `apps.movingenia.com` al servidor
3. **Puerto 22** (SSH) accesible desde tu máquina

## 🚀 Deployment Automático

El script `deploy-to-production.sh` automatiza todo el proceso de deployment:

```bash
./deploy-to-production.sh
```

### Lo que hace el script:

#### 1. Configuración Inicial
- ✅ Verifica y abre puertos del firewall (80, 443)
- ✅ Instala y configura certificado SSL de Let's Encrypt
- ✅ Crea archivo `.env` con variables de entorno necesarias
- ✅ Verifica que existan: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`, etc.

#### 2. Build del Proyecto
- ✅ Instala dependencias (`npm install`)
- ✅ Genera Prisma Client
- ✅ Copia archivos de Prisma a ubicaciones correctas
- ✅ Compila backend **sin** `.env` (para evitar que webpack los embeba)
- ✅ Compila frontend con `VITE_API_URL` de producción

#### 3. Configuración de Servicios
- ✅ Crea configuración de Nginx con proxy inverso
- ✅ Configura PM2 con dotenv para cargar variables en runtime
- ✅ Habilita reinicio automático de PM2

#### 4. Verificación
- ✅ Prueba que el backend responda
- ✅ Muestra estado de servicios
- ✅ Proporciona URLs y comandos útiles

## 🔧 Configuración Manual (si es necesario)

### Variables de Entorno

El archivo `apps/backend/.env` debe contener:

```env
DATABASE_URL="postgresql://transito:transito@dbsrv.movingenia.com:5432/monitoreo?schema=public"
JWT_SECRET="monitoreo-jwt-secret-2024"
JWT_REFRESH_SECRET="monitoreo-jwt-refresh-secret-2024"
NODE_ENV="production"
PORT=3000
```

### Configuración de Nginx

Si necesitas modificar la configuración de Nginx:

```bash
sudo nano /etc/nginx/sites-available/monitoreo
sudo nginx -t
sudo systemctl reload nginx
```

### PM2

Comandos útiles de PM2:

```bash
# Ver logs
pm2 logs monitoreo-backend

# Reiniciar backend
pm2 restart monitoreo-backend

# Ver estado
pm2 status

# Ver variables de entorno
pm2 env 0
```

## 🐛 Troubleshooting

### El backend no inicia

1. Verifica los logs:
   ```bash
   ssh apps.movingenia.com "pm2 logs monitoreo-backend --lines 50"
   ```

2. Verifica que las variables de entorno estén configuradas:
   ```bash
   ssh apps.movingenia.com "cat ~/monitoreo-apirest/apps/backend/.env"
   ```

3. Verifica que Prisma Client esté generado:
   ```bash
   ssh apps.movingenia.com "ls -la ~/monitoreo-apirest/.prisma/client/"
   ```

### Error "secretOrPrivateKey must have a value"

Esto indica que `JWT_SECRET` no se está cargando correctamente. Solución:

```bash
ssh apps.movingenia.com "cd ~/monitoreo-apirest && pm2 delete all && pm2 start ecosystem.config.js && pm2 save"
```

### Frontend no carga

1. Verifica que los archivos estén compilados:
   ```bash
   ssh apps.movingenia.com "ls -la ~/monitoreo-apirest/apps/frontend/dist/"
   ```

2. Verifica que Nginx esté sirviendo los archivos:
   ```bash
   ssh apps.movingenia.com "curl -I http://localhost/"
   ```

3. Verifica logs de Nginx:
   ```bash
   ssh apps.movingenia.com "sudo tail -f /var/log/nginx/monitoreo-error.log"
   ```

### Error 502 Bad Gateway

El backend no está respondiendo. Verifica:

```bash
ssh apps.movingenia.com "pm2 status"
ssh apps.movingenia.com "pm2 logs monitoreo-backend --err --lines 20"
```

### Certificado SSL no se renueva

Let's Encrypt configura renovación automática. Para verificar:

```bash
ssh apps.movingenia.com "sudo certbot renew --dry-run"
```

## 📝 Notas Importantes

### ⚠️ Webpack y Variables de Entorno

El backend se compila **sin** el archivo `.env` presente para evitar que webpack embeba las variables en tiempo de compilación. Esto permite que PM2 cargue las variables en tiempo de ejecución usando `dotenv/config`.

### ⚠️ Prisma Client

Los archivos de Prisma Client deben copiarse manualmente a:
- `~/monitoreo-apirest/.prisma/client/`
- `~/monitoreo-apirest/apps/backend/.prisma/client/`

El script de deployment hace esto automáticamente.

### ⚠️ JWT_REFRESH_SECRET

Además de `JWT_SECRET`, el sistema requiere `JWT_REFRESH_SECRET`. Ambos deben estar en el `.env`.

## 🔐 Seguridad

- Los certificados SSL se renuevan automáticamente cada 90 días
- El firewall (UFW) solo permite puertos 22, 80 y 443
- Las variables sensibles están en archivos `.env` no versionados
- PM2 carga las variables de entorno de forma segura

## 📊 URLs del Sistema

- **Frontend**: https://apps.movingenia.com
- **Backend API**: https://apps.movingenia.com/api
- **Swagger Docs**: https://apps.movingenia.com/docs

## 🔄 Actualizaciones Futuras

Para deployments posteriores, simplemente ejecuta:

```bash
./deploy-to-production.sh
```

El script:
1. Obtiene los últimos cambios de git
2. Reinstala dependencias si es necesario
3. Recompila el código
4. Reinicia los servicios
5. Verifica que todo esté funcionando
