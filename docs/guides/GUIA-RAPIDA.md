# 🚀 Guía Rápida - Sistema de Monitoreo

**Última actualización**: 28 de diciembre de 2025  
**Servidor**: 192.168.18.230

---

## 🌐 URLs del Sistema

### Backend (Puerto 3001)
```
🔗 API Base:         http://192.168.18.230:3001/api
📚 Swagger Docs:     http://192.168.18.230:3001/api/docs
🔐 Login:            http://192.168.18.230:3001/api/auth/login
🔄 Refresh:          http://192.168.18.230:3001/api/auth/refresh
👤 Usuario Actual:   http://192.168.18.230:3001/api/users/me
👥 Listar Usuarios:  http://192.168.18.230:3001/api/users
```

### Frontend (Puerto 5173)
```
🖥️  App:             http://192.168.18.230:5173
```

---

## 🔑 Credenciales

### Usuario de Prueba
```
Usuario:   admin_test
Password:  admin123
Rol:       ADMINISTRADOR
```

### Otros Usuarios
Los usuarios existentes en la base de datos pueden iniciar sesión si tienen `password_hash` configurado.

---

## ⚡ Comandos Rápidos

### Iniciar Servicios

```bash
# Iniciar backend (script automático)
./scripts/start-backend.sh

# O manualmente:
cd /home/alaines/monitoreo-apirest
npm run backend:dev

# Iniciar frontend
npm run frontend:dev

# Ambos servicios
npm run dev
```

### Detener Servicios

```bash
# Backend
pkill -9 -f "nest start"

# Frontend
pkill -9 -f "vite"

# Ambos
pkill -9 -f "nest start|vite"
```

### Ver Logs

```bash
# Backend en tiempo real
tail -f backend.log

# Frontend en tiempo real
tail -f frontend.log

# Últimas 50 líneas
tail -50 backend.log
```

### Estado del Servidor

```bash
# Ver procesos activos
ps aux | grep -E "nest|vite" | grep -v grep

# Ver puertos en uso
netstat -tlnp | grep -E "3001|5173"

# Probar conectividad API
curl -s http://192.168.18.230:3001/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin_test","password":"admin123"}' | jq .
```

---

## 🧪 Probar API

### 1. Login
```bash
# Request
curl -X POST http://192.168.18.230:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "admin_test",
    "password": "admin123"
  }' | jq .

# Guardar token
export TOKEN=$(curl -s -X POST http://192.168.18.230:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin_test","password":"admin123"}' | jq -r '.accessToken')

echo $TOKEN
```

### 2. Usuario Actual
```bash
curl -s http://192.168.18.230:3001/api/users/me \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 3. Listar Usuarios (Solo ADMIN)
```bash
curl -s http://192.168.18.230:3001/api/users \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 4. Refresh Token
```bash
# Guardar refresh token del login
export REFRESH_TOKEN=$(curl -s -X POST http://192.168.18.230:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin_test","password":"admin123"}' | jq -r '.refreshToken')

# Obtener nuevo access token
curl -s -X POST http://192.168.18.230:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" | jq .
```

---

## 🗃️ Base de Datos

### Conectarse a PostgreSQL
```bash
# Exportar password
export PGPASSWORD=transito

# Conectar con psql
psql -h 192.168.18.230 -U transito -d monitoreo

# Query directa
psql -h 192.168.18.230 -U transito -d monitoreo \
  -c "SELECT id, usuario, grupo_id FROM users LIMIT 5;"
```

### Prisma

```bash
# Generar cliente
npm run prisma:generate

# Migraciones
npm run prisma:migrate

# Studio (GUI)
npm run prisma:studio

# Seed
npx tsx apps/backend/prisma/seed.ts
```

---

## 🐛 Troubleshooting

### Backend no inicia

```bash
# Ver logs completos
cat backend.log

# Verificar puerto disponible
netstat -tlnp | grep 3001

# Matar proceso previo
pkill -9 -f "nest start"

# Verificar .env existe
ls -la .env

# Verificar DATABASE_URL
grep DATABASE_URL .env
```

### Error de compilación

```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install

# Regenerar Prisma
npm run prisma:generate

# Verificar TypeScript
npx tsc --noEmit
```

### Error de conexión a DB

```bash
# Probar conexión
psql -h 192.168.18.230 -U transito -d monitoreo -c "SELECT 1;"

# Verificar PostGIS
psql -h 192.168.18.230 -U transito -d monitoreo \
  -c "SELECT PostGIS_Version();"
```

### Puerto ya en uso

```bash
# Ver qué proceso usa el puerto
lsof -i :3001
# o
netstat -tlnp | grep 3001

# Matar el proceso
kill -9 <PID>
```

---

## 📚 Documentación

- [README Principal](../README.md)
- [Sprint 1 Completado](sprint-1-COMPLETADO.md)
- [Configuración del Servidor](SERVER-CONFIG.md)
- [Swagger API Docs](http://192.168.18.230:3001/api/docs)

---

## 🎯 Próximos Pasos

### Sprint 2 - Gestión de Incidencias
- [ ] CRUD de incidencias
- [ ] Geolocalización con PostGIS
- [ ] Clasificación por tipo
- [ ] Estados y flujo de trabajo
- [ ] Asignación de operadores
- [ ] Mapa interactivo

### Inmediato
- [ ] Levantar frontend React
- [ ] Probar login desde UI
- [ ] Configurar rutas protegidas
- [ ] Integrar con backend

---

## 💡 Tips

### Alias útiles
Agregar a `~/.bashrc`:

```bash
# Monitoreo API aliases
alias mon-backend='cd /home/alaines/monitoreo-apirest && npm run backend:dev'
alias mon-frontend='cd /home/alaines/monitoreo-apirest && npm run frontend:dev'
alias mon-logs='tail -f /home/alaines/monitoreo-apirest/backend.log'
alias mon-stop='pkill -9 -f "nest start|vite"'
alias mon-status='netstat -tlnp | grep -E "3001|5173"'
```

### Variables de entorno rápidas

```bash
# Cargar .env
cd /home/alaines/monitoreo-apirest
source .env
export $(cat .env | grep -v '^#' | xargs)

# Verificar
env | grep DATABASE
env | grep JWT
```

### Atajos de desarrollo

```bash
# Watch logs en otra terminal
watch -n 2 'tail -20 backend.log'

# Monitor de procesos
watch -n 1 'ps aux | grep -E "nest|node" | grep -v grep'

# Test endpoint en loop
while true; do 
  curl -s http://192.168.18.230:3001/api/auth/login \
    -X POST -H "Content-Type: application/json" \
    -d '{"usuario":"admin_test","password":"admin123"}' | jq -r '.accessToken' | cut -c1-50
  sleep 5
done
```

---

**Última verificación**: 28/12/2025 22:00  
**Estado**: ✅ Todos los servicios operativos
