#!/bin/bash
set -e

echo "🚀 Iniciando despliegue en apps.movingenia.com..."

# Ejecutar en el servidor remoto
ssh apps.movingenia.com 'bash -s' << 'ENDSSH'
set -e

cd ~/monitoreo-apirest

echo "� Obteniendo últimos cambios del repositorio..."
git stash push -m "Auto-stash before deployment $(date '+%Y-%m-%d %H:%M:%S')"
git fetch origin
git pull origin main
git stash pop || echo "No hay cambios locales que restaurar"

echo "📦 Instalando dependencias..."
npm install

echo "�📦 Instalando PM2 globalmente..."
sudo npm install -g pm2 || echo "PM2 ya instalado"

echo "🔧 Generando Prisma Client..."
cd apps/backend
npx prisma generate

echo "🏗️  Compilando backend..."
npm run build

echo "🎨 Compilando frontend..."
cd ../frontend
npm run build

echo "� Copiando archivos del frontend a nginx..."
sudo cp -r dist/* /var/www/alertas-web/
sudo chown -R www-data:www-data /var/www/alertas-web

echo "🔄 Recargando nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "�📝 Creando ecosystem.config.js para PM2..."
cd ~/monitoreo-apirest
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'monitoreo-backend',
      script: 'npm',
      args: 'run start:prod',
      cwd: '/home/daddyplayerperu/monitoreo-apirest/apps/backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/home/daddyplayerperu/monitoreo-apirest/logs/backend-error.log',
      out_file: '/home/daddyplayerperu/monitoreo-apirest/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'monitoreo-frontend',
      script: 'npx',
      args: 'vite preview --port 5173 --host 0.0.0.0',
      cwd: '/home/daddyplayerperu/monitoreo-apirest/apps/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/home/daddyplayerperu/monitoreo-apirest/logs/frontend-error.log',
      out_file: '/home/daddyplayerperu/monitoreo-apirest/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
EOF

echo "📁 Creando directorio de logs..."
mkdir -p logs

echo "🛑 Deteniendo procesos PM2 anteriores..."
pm2 delete all 2>/dev/null || echo "No hay procesos que detener"

echo "▶️  Iniciando servicios con PM2..."
pm2 start ecosystem.config.js

echo "💾 Guardando configuración PM2..."
pm2 save

echo "🔄 Configurando PM2 para inicio automático..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u daddyplayerperu --hp /home/daddyplayerperu || echo "PM2 startup ya configurado"

echo "📊 Estado de PM2:"
pm2 status

echo ""
echo "✅ Despliegue completado"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://apps.movingenia.com"
echo "   Backend:  http://apps.movingenia.com/api"
echo ""
echo "📝 Ver logs:"
echo "   pm2 logs"
echo "   pm2 logs monitoreo-backend"
echo "   pm2 logs monitoreo-frontend"
echo ""
ENDSSH

echo ""
echo "🎉 ¡Despliegue finalizado exitosamente!"
echo ""
