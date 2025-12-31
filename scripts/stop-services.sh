#!/bin/bash
# Script para detener todos los servicios del sistema de monitoreo
# DEPRECATED: Usar stop-all.sh en su lugar

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "⚠️  AVISO: Este script está deprecated. Usa stop-all.sh"
echo ""
sleep 2

# Redirigir al nuevo script
bash "$SCRIPT_DIR/stop-all.sh"
