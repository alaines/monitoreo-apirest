# Gestión de Desarrollo con PM2

Este proyecto usa PM2 para gestionar los procesos de desarrollo del backend y frontend.

## Comandos Principales

### Iniciar Servicios
```bash
npm run dev
```
Inicia ambos servicios (backend y frontend) en modo desarrollo.

### Ver Estado
```bash
npm run dev:status
```
Muestra el estado actual de los servicios.

### Ver Logs en Tiempo Real
```bash
npm run dev:logs
```
Muestra los logs de ambos servicios. Usa `Ctrl+C` para salir.

Para ver logs de un servicio específico:
```bash
pm2 logs monitoreo-backend
pm2 logs monitoreo-frontend
```

### Reiniciar Servicios
```bash
npm run dev:restart
```
Reinicia ambos servicios sin detenerlos completamente.

### Detener Servicios
```bash
npm run dev:stop
```
Detiene ambos servicios pero los mantiene en PM2.

### Eliminar de PM2
```bash
npm run dev:delete
```
Elimina los servicios de PM2 completamente.

## Archivos de Log

Los logs se guardan en:
- Backend: `apps/backend/logs/`
- Frontend: `apps/frontend/logs/`

## Ventajas de PM2

- Reinicio automático si hay errores
- Gestión centralizada de procesos
- Logs organizados y persistentes
- No necesitas múltiples terminales
- Fácil monitoreo del estado

## Comandos Avanzados de PM2

```bash
# Ver logs históricos
pm2 logs --lines 100

# Limpiar logs
pm2 flush

# Monitoreo en tiempo real
pm2 monit

# Ver información detallada
pm2 show monitoreo-backend

# Reiniciar con nuevas variables de entorno
pm2 restart ecosystem.config.js --update-env
```

## Acceso a la Aplicación

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api
- **Credenciales:** `admin` / `Admin123`
