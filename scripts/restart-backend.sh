#!/bin/bash
# Script para reiniciar el backend del sistema de monitoreo

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 Reiniciando Backend..."
echo ""

# Detener backend
bash "$SCRIPT_DIR/stop-backend.sh"

echo ""
sleep 2

# Iniciar backend
bash "$SCRIPT_DIR/start-backend.sh"
