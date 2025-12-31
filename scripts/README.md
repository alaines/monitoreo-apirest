# Scripts de Gestión de Servicios

Este directorio contiene scripts para gestionar los servicios del Sistema de Monitoreo.

## 🎯 Scripts Principales

### Gestión del Sistema Completo

#### 🚀 start-all.sh
Inicia todos los servicios del sistema (Backend + Frontend).

```bash
bash scripts/start-all.sh
# o simplemente
./scripts/start-all.sh
```

**Características:**
- Inicia backend y frontend en orden
- Verifica que cada servicio inicie correctamente
- Muestra URLs de acceso al finalizar
- Si algo falla, detiene todo automáticamente

---

#### 🛑 stop-all.sh
Detiene todos los servicios del sistema.

```bash
bash scripts/stop-all.sh
```

**Características:**
- Cierre graceful primero (SIGTERM)
- Si no responde, forzar cierre (SIGKILL)
- Limpia procesos residuales
- Libera puertos 3001 y 5173

---

#### 🔄 restart-all.sh
Reinicia todos los servicios del sistema.

```bash
bash scripts/restart-all.sh
```

Equivale a ejecutar `stop-all.sh` seguido de `start-all.sh`.

---

## 🔧 Scripts Individuales

### Backend

#### 🚀 start-backend.sh
Inicia solo el backend (NestJS en puerto 3001).

```bash
bash scripts/start-backend.sh
```

**URLs generadas:**
- API Base: http://192.168.18.230:3001/api
- Swagger: http://192.168.18.230:3001/api/docs
- Login: http://192.168.18.230:3001/api/auth/login

**Log:** `backend.log` en la raíz del proyecto

---

#### 🛑 stop-backend.sh
Detiene solo el backend.

```bash
bash scripts/stop-backend.sh
```

---

#### 🔄 restart-backend.sh
Reinicia solo el backend.

```bash
bash scripts/restart-backend.sh
```

Útil cuando solo modificaste código del backend.

---

### Frontend

#### 🚀 start-frontend.sh
Inicia solo el frontend (Vite en puerto 5173).

```bash
bash scripts/start-frontend.sh
```

**URLs generadas:**
- Local: http://localhost:5173
- Network: http://192.168.18.230:5173

**Log:** `frontend.log` en la raíz del proyecto

---

#### 🛑 stop-frontend.sh
Detiene solo el frontend.

```bash
bash scripts/stop-frontend.sh
```

---

#### 🔄 restart-frontend.sh
Reinicia solo el frontend.

```bash
bash scripts/restart-frontend.sh
```

Útil cuando solo modificaste código del frontend.

---

## 🔍 Scripts de Utilidad

### check-services.sh
Verifica el estado de los servicios.

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

### 🌱 seed-incidents.sh
Crea incidencias de prueba en la base de datos.

```bash
bash scripts/seed-incidents.sh
```

**Crea:**
- 5 incidencias de prueba
- Cada una asociada a un cruce diferente
- Todas con coordenadas válidas
- Diferentes tipos, prioridades y estados

---

## 📋 Flujo de Trabajo Recomendado

### Inicio del día
```bash
./scripts/start-all.sh
```

### Desarrollo - Solo modificaste backend
```bash
./scripts/restart-backend.sh
```

### Desarrollo - Solo modificaste frontend
```bash
./scripts/restart-frontend.sh
```

### Verificar que todo funciona
```bash
./scripts/check-services.sh
```

### Ver logs en tiempo real
```bash
# Backend
tail -f backend.log

# Frontend
tail -f frontend.log

# Ambos a la vez
tail -f backend.log frontend.log
```

### Detener al finalizar
```bash
./scripts/stop-all.sh
```

---

## 🎨 Estructura de Scripts

```
scripts/
├── start-all.sh          # Inicia todo el sistema
├── stop-all.sh           # Detiene todo el sistema
├── restart-all.sh        # Reinicia todo el sistema
│
├── start-backend.sh      # Inicia solo backend
├── stop-backend.sh       # Detiene solo backend
├── restart-backend.sh    # Reinicia solo backend
│
├── start-frontend.sh     # Inicia solo frontend
├── stop-frontend.sh      # Detiene solo frontend
├── restart-frontend.sh   # Reinicia solo frontend
│
├── check-services.sh     # Verifica estado de servicios
├── seed-incidents.sh     # Crea datos de prueba
│
└── README.md            # Este archivo
```

---

## ⚠️ Notas Importantes

- Los scripts usan `lsof` para verificar puertos. Asegúrate de tenerlo instalado.
- Los logs se guardan en la raíz del proyecto (`backend.log` y `frontend.log`).
- El backend tarda ~40-60 segundos en compilar la primera vez.
- El frontend tarda ~10-20 segundos en estar listo.
- Si un puerto está en uso, el script intentará liberarlo automáticamente.

---

## 🆘 Solución de Problemas

### Puerto en uso
```bash
# Ver qué proceso usa el puerto 3001
lsof -i:3001

# Ver qué proceso usa el puerto 5173
lsof -i:5173

# Matar proceso específico
kill -9 <PID>
```

### Ver logs de error
```bash
# Backend
tail -100 backend.log

# Frontend
tail -100 frontend.log
```

### Limpiar todo y reiniciar
```bash
./scripts/stop-all.sh
pkill -9 -f "nest start"
pkill -9 -f "vite"
sleep 2
./scripts/start-all.sh
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
