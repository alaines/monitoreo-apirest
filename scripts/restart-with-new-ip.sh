#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/apps/backend"
FRONTEND_DIR="$ROOT_DIR/apps/frontend"

BACKEND_PM2_NAME="monitoreo-backend"
FRONTEND_PM2_NAME="monitoreo-frontend"

BUILD_BACKEND=true
BUILD_FRONTEND=false
RESTART_ONLY=false

print_usage() {
  cat << 'EOF'
Uso:
  ./restart-with-new-ip.sh [opciones]

Opciones:
  --build-frontend   Fuerza build del frontend antes de reiniciar PM2
  --restart-only     Solo reinicia procesos PM2 (sin builds)
  -h, --help         Muestra esta ayuda

Comportamiento por defecto (entorno local actual):
  1) Build backend
  2) Reinicio backend + frontend en PM2
  3) NO build frontend (porque PM2 frontend corre con "npm run dev")
EOF
}

for arg in "$@"; do
  case "$arg" in
    --build-frontend)
      BUILD_FRONTEND=true
      ;;
    --restart-only)
      RESTART_ONLY=true
      BUILD_BACKEND=false
      BUILD_FRONTEND=false
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "Argumento no reconocido: $arg"
      print_usage
      exit 1
      ;;
  esac
done

echo "==> Aplicando cambio de IP en entorno local con PM2"
echo "    Root: $ROOT_DIR"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "ERROR: pm2 no está instalado o no está en PATH"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm no está instalado o no está en PATH"
  exit 1
fi

if [ "$RESTART_ONLY" = false ] && [ "$BUILD_BACKEND" = true ]; then
  echo "==> Build backend"
  cd "$BACKEND_DIR"
  npm run build
fi

if [ "$RESTART_ONLY" = false ] && [ "$BUILD_FRONTEND" = true ]; then
  echo "==> Build frontend (forzado)"
  cd "$FRONTEND_DIR"
  npm run build
else
  if [ "$RESTART_ONLY" = false ]; then
    echo "==> Build frontend omitido (modo local con PM2 + npm run dev)"
  fi
fi

echo "==> Reiniciando procesos PM2"
cd "$ROOT_DIR"
pm2 restart "$BACKEND_PM2_NAME" || pm2 restart all
pm2 restart "$FRONTEND_PM2_NAME" || pm2 restart all

echo "==> Estado PM2"
pm2 status

echo "✅ Listo. Si cambiaste VITE_* y usas build estático, ejecuta también:"
echo "   ./restart-with-new-ip.sh --build-frontend"
