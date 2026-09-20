# Configuración de Nginx para Producción

Este archivo contiene la configuración de nginx para el servidor de producción.

## Ubicación
`/etc/nginx/sites-available/monitoreo`

## Configuración

```nginx
server {
    listen 80;
    server_name apps.movingenia.com;

    # Logs
    access_log /var/log/nginx/monitoreo-access.log;
    error_log /var/log/nginx/monitoreo-error.log;

    # Frontend - raíz del sitio
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
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts para operaciones largas
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Máximo tamaño de carga (para uploads)
    client_max_body_size 50M;
}
```

## Instalación

1. Copiar el archivo de configuración:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/monitoreo
```

2. Crear enlace simbólico:
```bash
sudo ln -sf /etc/nginx/sites-available/monitoreo /etc/nginx/sites-enabled/
```

3. Probar la configuración:
```bash
sudo nginx -t
```

4. Recargar nginx:
```bash
sudo systemctl reload nginx
```

## Notas Importantes

- **Frontend**: Corre en `http://localhost:5173` (PM2)
- **Backend**: Corre en `http://localhost:3001` (PM2)
- **Nginx**: Escucha en puerto 80 y hace proxy a ambos servicios
- **API URL en frontend**: Debe ser `/api` (ruta relativa) para que nginx haga el proxy correctamente

## Verificación

```bash
# Ver logs de nginx
sudo tail -f /var/log/nginx/monitoreo-access.log
sudo tail -f /var/log/nginx/monitoreo-error.log

# Probar endpoint
curl http://apps.movingenia.com/api/health
```

## Troubleshooting

### Error 502 Bad Gateway
- Verificar que los servicios PM2 estén corriendo: `pm2 status`
- Verificar que los puertos 3001 y 5173 estén escuchando: `netstat -tlnp | grep -E '3001|5173'`

### CORS errors
- Verificar que los headers `X-Forwarded-*` estén configurados correctamente en nginx
- El backend debe confiar en el proxy (configuración de CORS en NestJS)

### Peticiones a /api no llegan al backend
- Verificar que `location /api/` tenga el trailing slash en ambos lados
- El `proxy_pass` debe ser `http://localhost:3001/api/` (con trailing slash)
