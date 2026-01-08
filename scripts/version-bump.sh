#!/bin/bash
# Script de incremento de versión automático
# Uso: ./scripts/version-bump.sh [patch|minor|major]
# Ejemplo: ./scripts/version-bump.sh minor

set -e  # Salir si hay algún error

TYPE=${1:-patch}

# Validar tipo de versión
if [[ ! "$TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo "❌ Error: Tipo de versión inválido"
  echo "Uso: ./scripts/version-bump.sh [patch|minor|major]"
  exit 1
fi

echo "📦 Incrementando versión ($TYPE)..."

# Actualizar package.json raíz
npm version $TYPE --no-git-tag-version

# Extraer nueva versión
VERSION=$(node -p "require('./package.json').version")

# Actualizar VERSION file
echo $VERSION > VERSION

# Actualizar apps/backend/package.json
echo "  📦 Actualizando backend..."
cd apps/backend
npm version $VERSION --no-git-tag-version --allow-same-version
cd ../..

# Actualizar apps/frontend/package.json
echo "  📦 Actualizando frontend..."
cd apps/frontend
npm version $VERSION --no-git-tag-version --allow-same-version
cd ../..

echo ""
echo "✅ Versión actualizada a: v$VERSION"
echo ""
echo "📝 Próximos pasos:"
echo "  1. Actualiza CHANGELOG.md con los cambios"
echo "  2. Commit: git add . && git commit -m 'chore: bump version to $VERSION'"
echo "  3. Tag: git tag -a v$VERSION -m 'Version $VERSION'"
echo "  4. Push: git push origin main --tags"
echo ""
