# Sistema de Versionado - Guía Rápida

## Versión Actual: **v1.0.1**

## Uso Rápido

### Ver Versión Actual
```bash
cat VERSION
# o
npm version
```

### Incrementar Versión

```bash
# Para correcciones de bugs (1.0.1 → 1.0.2)
npm run version:patch

# Para nuevas funcionalidades (1.0.1 → 1.1.0)
npm run version:minor

# Para cambios que rompen compatibilidad (1.0.1 → 2.0.0)
npm run version:major
```

### Crear Release

```bash
# 1. Incrementar versión
npm run version:patch

# 2. Actualizar CHANGELOG.md con los cambios

# 3. Commit y tag
git add .
git commit -m "chore: bump version to X.Y.Z"
git tag -a vX.Y.Z -m "Version X.Y.Z: Descripción"

# 4. Push con tags
git push origin main --tags

# O usar el script automatizado:
npm run release vX.Y.Z "Mensaje del release"
```

## Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `VERSION` | Versión actual del proyecto |
| `CHANGELOG.md` | Historial de cambios |
| `package.json` | Versión npm (raíz) |
| `apps/*/package.json` | Versiones de workspaces |
| `docs/guides/VERSIONING.md` | Guía completa |

## Tags Git

```bash
# Ver todos los tags
git tag -l

# Ver detalles de un tag
git show v1.0.1

# Checkout a una versión específica
git checkout v1.0.0
```

## Historial de Versiones

### Versiones de Producción

- **v1.0.1** (2026-01-08) - Correcciones de WebSocket y timezone
- **v1.0.0** (2026-01-08) - Sprint 8: Sistema de notificaciones

### Versiones de Desarrollo

- **v0.7.0** (2026-01-06) - PM2, mapa de calor, perfil de usuario
- **v0.6.0** (2026-01-05) - Formularios completos, catálogos
- **v0.5.0** (2026-01-04) - Reportes gráficos
- **v0.4.0** (2026-01-03) - Gestión de periféricos
- **v0.3.0** (2025-12-28) - Gestión de incidencias
- **v0.2.0** (2025-12-20) - Sistema RBAC
- **v0.1.0** (2025-12-15) - Arquitectura base

## Workflow de Release

1. **Desarrollo** → Trabajo en feature branches
2. **Merge a Main** → Pull request aprobado
3. **Bump Version** → `npm run version:patch|minor|major`
4. **Update CHANGELOG** → Documentar cambios
5. **Commit** → `git commit -m "chore: bump version"`
6. **Tag** → `git tag -a vX.Y.Z -m "Message"`
7. **Push** → `git push origin main --tags`
8. **Deploy** → Deployment a producción

## Convenciones de Commits

```bash
feat: Nueva funcionalidad
fix: Corrección de bug
docs: Cambios en documentación
chore: Mantenimiento/configuración
refactor: Refactorización de código
test: Agregar o corregir tests
perf: Mejora de performance
```

## Más Información

- **[CHANGELOG.md](../CHANGELOG.md)** - Historial completo de cambios
- **[VERSIONING.md](VERSIONING.md)** - Guía detallada de versionado
- **[Semantic Versioning](https://semver.org/lang/es/)** - Especificación oficial

---

**Última actualización**: 2026-01-08  
**Versión de esta guía**: 1.0.0
