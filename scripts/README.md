# Scripts de Gestión de Servicios

Este directorio contiene scripts para gestionar los servicios del Sistema de Monitoreo.

## Scripts Disponibles

### 🚀 start-services.sh
Inicia ambos servicios (Backend y Frontend) de forma robusta.

**Uso:**
```bash
bash scripts/start-services.sh
```

**Características:**
- Limpia procesos anteriores automáticamente
- Verifica y libera puertos si están en uso
- Espera a que los servicios inicien correctamente
- Crea logs en `logs/backend.log` y `logs/frontend.log`
- Tiempo de espera inteligente (60s para backend, 20s para frontend)
- Muestra errores con últimas líneas de log si algo falla

**Servicios iniciados:**
- Backend: http://192.168.18.230:3001/api
- Swagger: http://192.168.18.230:3001/docs
- Frontend: http://192.168.18.230:5173

---

### 🔍 check-services.sh
Verifica el estado de los servicios.

**Uso:**
```bash
bash scripts/check-services.sh
```

**Muestra:**
- Estado de Backend (puerto 3001)
- Estado de Frontend (puerto 5173)
- PIDs de los procesos
- Test de conectividad HTTP
- Últimas líneas de los logs

---

### 🛑 stop-services.sh
Detiene ambos servicios de forma segura.

**Uso:**
```bash
bash scripts/stop-services.sh
```

**Características:**
- Cierre graceful primero (SIGTERM)
- Si no responde, forzar cierre (SIGKILL)
- Limpia procesos residuales
- Verifica que los puertos queden liberados

---

### 🌱 seed-incidents.sh
Crea incidencias de prueba en la base de datos.

**Uso:**
```bash
bash scripts/seed-incidents.sh
```

**Crea:**
- 5 incidencias de prueba
- Cada una asociada a un cruce diferente
- Todas con coordenadas válidas
- Diferentes tipos, prioridades y estados

## Flujo de Trabajo Recomendado

### Inicio del día
```bash
bash scripts/start-services.sh
```

### Verificar que todo funciona
```bash
bash scripts/check-services.sh
```

### Ver logs en tiempo real
```bash
# Backend
tail -f logs/backend.log

# Frontend
tail -f logs/frontend.log
```

### Detener al finalizar
```bash
bash scripts/stop-services.sh
```

## Solución de Problemas

### Los servicios no inician
1. Verificar logs: `cat logs/backend.log` o `cat logs/frontend.log`
2. Verificar base de datos: `docker ps` (debe haber un container de postgres)
3. Detener todo y reiniciar: 
   ```bash
   bash scripts/stop-services.sh
   bash scripts/start-services.sh
   ```

### Puerto en uso
Los scripts limpian automáticamente, pero si hay problemas:
```bash
# Ver qué usa el puerto 3001
lsof -i:3001

# Ver qué usa el puerto 5173
lsof -i:5173

# Matar proceso específico
kill -9 <PID>
```

### Frontend se congela al hacer cambios
El frontend usa Vite con HMR (Hot Module Replacement). Si se congela:
1. Los logs mostrarán el error
2. Vite intentará recargar automáticamente
3. Si persiste, reiniciar con `bash scripts/stop-services.sh && bash scripts/start-services.sh`

## Estructura de Logs

Los logs se guardan en `PROJECT_ROOT/logs/`:
- `backend.log`: Salida completa del backend NestJS
- `frontend.log`: Salida completa del frontend Vite

Los logs incluyen:
- Timestamps
- Errores de compilación
- Warnings
- Inicio/cierre de servicios
- Peticiones HTTP (en desarrollo)
