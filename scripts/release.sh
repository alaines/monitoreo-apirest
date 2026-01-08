#!/bin/bash
# Script de creación de release
# Uso: ./scripts/release.sh v1.0.1 "Mensaje del release"

set -e

TAG=$1
MESSAGE=${2:-"Release $TAG"}

if [ -z "$TAG" ]; then
  echo "❌ Error: Debes especificar un tag"
  echo "Uso: ./scripts/release.sh v1.0.1 'Mensaje del release'"
  exit 1
fi

# Validar formato de tag
if [[ ! "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "❌ Error: Formato de tag inválido"
  echo "El tag debe seguir el formato: vX.Y.Z (ejemplo: v1.0.1)"
  exit 1
fi

echo "🚀 Creando release $TAG..."
echo ""

# Verificar que no hay cambios sin commit
if [[ -n $(git status -s) ]]; then
  echo "⚠️ Advertencia: Hay cambios sin commit:"
  git status -s
  echo ""
  read -p "¿Continuar de todas formas? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Release cancelado"
    exit 1
  fi
fi

# Verificar que estamos en main
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "⚠️ Advertencia: No estás en la rama main (estás en: $BRANCH)"
  read -p "¿Continuar de todas formas? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Release cancelado"
    exit 1
  fi
fi

# Verificar que el tag no existe
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "❌ Error: El tag $TAG ya existe"
  exit 1
fi

# Crear tag anotado
echo "🏷️ Creando tag $TAG..."
git tag -a $TAG -m "$MESSAGE"

# Push del tag
echo "📤 Publicando tag..."
git push origin $TAG

# Push de la rama actual también
echo "📤 Publicando rama $BRANCH..."
git push origin $BRANCH

echo ""
echo "✅ Release $TAG creado y publicado exitosamente!"
echo ""
echo "📋 Información del release:"
echo "  Tag: $TAG"
echo "  Mensaje: $MESSAGE"
echo "  Branch: $BRANCH"
echo "  Commit: $(git rev-parse --short HEAD)"
echo ""
echo "🌐 Ver en GitHub:"
echo "  https://github.com/alaines/monitoreo-apirest/releases/tag/$TAG"
echo ""
