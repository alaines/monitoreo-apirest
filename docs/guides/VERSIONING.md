# Guía de Versionado

## 📦 Semantic Versioning

Este proyecto sigue [Semantic Versioning 2.0.0](https://semver.org/lang/es/):

```
MAJOR.MINOR.PATCH

Ejemplo: 1.2.3
```

### Componentes de la Versión

- **MAJOR** (1.x.x): Cambios incompatibles con versiones anteriores
- **MINOR** (x.1.x): Nuevas funcionalidades compatibles hacia atrás
- **PATCH** (x.x.1): Correcciones de bugs compatibles

### Reglas de Incremento

#### Incrementar MAJOR cuando:
- Se eliminan funcionalidades existentes
- Se cambian APIs públicas de forma incompatible
- Se requieren cambios en configuración del cliente
- Se realizan migraciones de base de datos que requieren intervención manual

**Ejemplo**: `1.5.2` → `2.0.0`

#### Incrementar MINOR cuando:
- Se agregan nuevas funcionalidades
- Se implementan nuevos endpoints de API
- Se agregan nuevas tablas o columnas opcionales
- Se mejoran funcionalidades existentes sin romper compatibilidad

**Ejemplo**: `1.5.2` → `1.6.0`

#### Incrementar PATCH cuando:
- Se corrigen bugs
- Se mejoran textos o traducciones
- Se actualizan dependencias de seguridad
- Se corrigen errores de lógica sin agregar funcionalidad

**Ejemplo**: `1.5.2` → `1.5.3`

## 🔄 Proceso de Versionado

### 1. Antes de Hacer Cambios

```bash
# Verificar versión actual
cat VERSION

# O desde package.json
npm version
```

### 2. Durante el Desarrollo

```bash
# Trabajar en rama feature
git checkout -b feature/nombre-funcionalidad

# Commits con prefijos convencionales
git commit -m "feat: agregar sistema de notificaciones"
git commit -m "fix: corregir carga de mapa"
git commit -m "docs: actualizar README"
```

### 3. Antes de Merge a Main

```bash
# Actualizar versión según tipo de cambio
npm version patch  # Para fixes (1.0.0 → 1.0.1)
npm version minor  # Para features (1.0.0 → 1.1.0)
npm version major  # Para breaking changes (1.0.0 → 2.0.0)

# Actualizar CHANGELOG.md manualmente
# (ver sección de Changelog)

# Crear tag
git tag -a v1.0.1 -m "Version 1.0.1: Correcciones de producción"

# Push con tags
git push origin main --tags
```

### 4. Deployment a Producción

```bash
# Checkout del tag
git checkout v1.0.1

# O usar el script de deployment
./scripts/deploy.sh v1.0.1
```

## 📝 Actualizar CHANGELOG

### Formato Estándar

Cada entrada debe seguir este formato:

```markdown
## [1.0.1] - 2026-01-08

### ✨ Agregado (Added)
- Nueva funcionalidad 1
- Nueva funcionalidad 2

### 🎨 Mejorado (Changed)
- Mejora en componente X
- Optimización de Y

### 🔧 Corregido (Fixed)
- Bug en módulo A
- Error en validación B

### 🗑️ Eliminado (Removed)
- Funcionalidad deprecada X

### 🔒 Seguridad (Security)
- Parche de vulnerabilidad CVE-XXXX

### 🗄️ Base de Datos
- Migración 010: Descripción
```

### Categorías de Cambios

| Emoji | Categoría | Cuándo Usar |
|-------|-----------|-------------|
| ✨ | **Agregado** (Added) | Nuevas funcionalidades |
| 🎨 | **Mejorado** (Changed) | Cambios en funcionalidades existentes |
| 🔧 | **Corregido** (Fixed) | Correcciones de bugs |
| 🗑️ | **Eliminado** (Removed) | Funcionalidades eliminadas |
| 🔒 | **Seguridad** (Security) | Correcciones de seguridad |
| 🗄️ | **Base de Datos** | Migraciones o cambios de schema |
| 📚 | **Documentación** | Solo cambios en docs |
| ⚠️ | **Deprecado** (Deprecated) | Funcionalidades a eliminar |

## 🏷️ Sistema de Tags Git

### Convención de Nombres

```
v<MAJOR>.<MINOR>.<PATCH>[-<PRE-RELEASE>]

Ejemplos:
v1.0.0        # Release estable
v1.0.1        # Patch
v2.0.0-beta.1 # Pre-release beta
v2.0.0-rc.1   # Release candidate
```

### Crear Tags

```bash
# Tag ligero (solo referencia)
git tag v1.0.1

# Tag anotado (recomendado - incluye mensaje y metadata)
git tag -a v1.0.1 -m "Version 1.0.1: Correcciones WebSocket y timezone"

# Tag con descripción larga
git tag -a v1.0.1 -m "Version 1.0.1

Correcciones importantes:
- WebSocket proxy configurado
- Timezone estandarizado a UTC
- Nginx optimizado
"

# Listar tags
git tag

# Ver detalles de un tag
git show v1.0.1

# Eliminar tag local
git tag -d v1.0.1

# Eliminar tag remoto
git push origin --delete v1.0.1
```

### Push de Tags

```bash
# Push de un tag específico
git push origin v1.0.1

# Push de todos los tags
git push origin --tags

# Push de branch y tags
git push origin main --tags
```

## 📋 Checklist de Release

### Pre-Release

- [ ] Todas las pruebas pasan (`npm test`)
- [ ] Linter sin errores (`npm run lint`)
- [ ] Build exitoso (`npm run build`)
- [ ] Documentación actualizada
- [ ] CHANGELOG.md actualizado
- [ ] VERSION actualizado
- [ ] package.json actualizado

### Release

- [ ] Incrementar versión (`npm version [patch|minor|major]`)
- [ ] Commit de versión (`git commit -m "chore: bump version to X.Y.Z"`)
- [ ] Crear tag (`git tag -a vX.Y.Z -m "Version X.Y.Z"`)
- [ ] Push a main con tags (`git push origin main --tags`)
- [ ] Crear GitHub Release (opcional)
- [ ] Deploy a producción
- [ ] Verificar deployment
- [ ] Notificar al equipo

### Post-Release

- [ ] Monitorear errores en producción
- [ ] Verificar métricas de performance
- [ ] Actualizar roadmap si es necesario
- [ ] Documentar lecciones aprendidas

## 🔧 Scripts de Automatización

### Script de Bump de Versión

Crear `scripts/version-bump.sh`:

```bash
#!/bin/bash
# Uso: ./scripts/version-bump.sh [patch|minor|major]

TYPE=${1:-patch}

echo "📦 Incrementando versión ($TYPE)..."

# Actualizar package.json
npm version $TYPE --no-git-tag-version

# Extraer nueva versión
VERSION=$(node -p "require('./package.json').version")

# Actualizar VERSION file
echo $VERSION > VERSION

# Actualizar apps/backend/package.json
cd apps/backend
npm version $VERSION --no-git-tag-version
cd ../..

# Actualizar apps/frontend/package.json
cd apps/frontend
npm version $VERSION --no-git-tag-version
cd ../..

echo "✅ Versión actualizada a: $VERSION"
echo "📝 Ahora actualiza CHANGELOG.md"
echo "🏷️ Luego ejecuta: git tag -a v$VERSION -m 'Version $VERSION'"
```

### Script de Release

Crear `scripts/release.sh`:

```bash
#!/bin/bash
# Uso: ./scripts/release.sh v1.0.1 "Mensaje del release"

TAG=$1
MESSAGE=${2:-"Release $TAG"}

if [ -z "$TAG" ]; then
  echo "❌ Error: Debes especificar un tag"
  echo "Uso: ./scripts/release.sh v1.0.1 'Mensaje'"
  exit 1
fi

echo "🚀 Creando release $TAG..."

# Verificar que no hay cambios sin commit
if [[ -n $(git status -s) ]]; then
  echo "⚠️ Advertencia: Hay cambios sin commit"
  git status -s
  read -p "¿Continuar? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Crear tag
git tag -a $TAG -m "$MESSAGE"

# Push
git push origin main --tags

echo "✅ Release $TAG creado y publicado"
echo "🌐 Ver en: https://github.com/alaines/monitoreo-apirest/releases/tag/$TAG"
```

## 📊 Historial de Versiones

### Versión Actual
**v1.0.1** (2026-01-08)

### Historial Completo
Consultar [CHANGELOG.md](../CHANGELOG.md)

## 🔗 Referencias

- [Semantic Versioning](https://semver.org/lang/es/)
- [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
- [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/)
- [Git Tagging](https://git-scm.com/book/es/v2/Fundamentos-de-Git-Etiquetado)
