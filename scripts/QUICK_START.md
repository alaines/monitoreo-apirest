# 🚀 Guía Rápida de Scripts

## Comandos Más Usados

### Iniciar todo el sistema
```bash
./scripts/start-all.sh
```

### Detener todo el sistema
```bash
./scripts/stop-all.sh
```

### Reiniciar todo el sistema
```bash
./scripts/restart-all.sh
```

---

## Comandos por Componente

### Solo Backend
```bash
./scripts/start-backend.sh     # Iniciar
./scripts/stop-backend.sh      # Detener
./scripts/restart-backend.sh   # Reiniciar
```

### Solo Frontend
```bash
./scripts/start-frontend.sh    # Iniciar
./scripts/stop-frontend.sh     # Detener
./scripts/restart-frontend.sh  # Reiniciar
```

---

## Otros Comandos Útiles

### Ver estado de servicios
```bash
./scripts/check-services.sh
```

### Crear datos de prueba
```bash
./scripts/seed-incidents.sh
```

### Ver logs
```bash
# Backend
tail -f backend.log

# Frontend
tail -f frontend.log
```

---

## 📖 Documentación Completa

Ver [README.md](./README.md) para documentación detallada de todos los scripts.
