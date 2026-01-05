#!/bin/bash

# Script de Deploy a Producción
# Sistema de Monitoreo de Tráfico
# Fecha: 4 de enero de 2026

set -e

echo "🚀 Iniciando deploy a producción..."
echo "=================================="

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables de entorno
PROD_SERVER="apps.movingenia.com"
DB_SERVER="dbsrv.movingenia.com"
PROD_USER="alaines"
PROD_DIR="/home/alaines/monitoreo-apirest"
BACKEND_PORT=3001
FRONTEND_PORT=5173

echo -e "${YELLOW}📦 Paso 1: Verificando commits locales...${NC}"
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${RED}❌ Hay cambios sin commitear. Por favor, haz commit primero.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Todo commiteado${NC}"

echo -e "${YELLOW}📤 Paso 2: Enviando cambios al repositorio remoto...${NC}"
git push origin main
echo -e "${GREEN}✅ Cambios enviados a GitHub${NC}"

echo -e "${YELLOW}🔄 Paso 3: Conectando al servidor de producción (${PROD_SERVER})...${NC}"
ssh ${PROD_USER}@${PROD_SERVER} << 'ENDSSH'
cd /home/alaines/monitoreo-apirest || { echo "❌ Error: Directorio no encontrado"; exit 1; }

echo "📥 Descargando últimos cambios..."
git pull origin main

echo "🔧 Actualizando dependencias del backend..."
cd apps/backend
npm install --production

echo "🏗️ Compilando backend..."
npm run build

echo "🔄 Reiniciando backend con PM2..."
pm2 restart monitoreo-backend || pm2 start dist/main.js --name monitoreo-backend

echo "📦 Actualizando dependencias del frontend..."
cd ../frontend
npm install

echo "🏗️ Compilando frontend..."
npm run build

echo "🔄 Reiniciando frontend con PM2..."
pm2 restart monitoreo-frontend || pm2 serve dist ${FRONTEND_PORT} --spa --name monitoreo-frontend

echo "✅ Deploy completado en el servidor"
ENDSSH

echo -e "${GREEN}=================================="
echo -e "✅ Deploy completado exitosamente"
echo -e "=================================="${NC}

echo ""
echo "📊 Verificar servicios en:"
echo "   Backend:  http://${PROD_SERVER}:${BACKEND_PORT}/api"
echo "   Frontend: http://${PROD_SERVER}:${FRONTEND_PORT}"
echo ""
echo "Para ver logs:"
echo "   Backend:  pm2 logs monitoreo-backend"
echo "   Frontend: pm2 logs monitoreo-frontend"
echo ""
