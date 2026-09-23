#!/bin/bash
set -e

echo "🚀 Iniciando despliegue en apps.movingenia.com..."

# Ejecutar en el servidor remoto
ssh apps.movingenia.com 'bash -s' << 'ENDSSH'
set -e

cd ~/monitoreo-apirest

echo "📥 Obteniendo últimos cambios del repositorio..."
git stash push -m "Auto-stash before deployment $(date '+%Y-%m-%d %H:%M:%S')"
git fetch origin
git pull origin main
git stash pop || echo "No hay cambios locales que restaurar"

echo "📦 Instalando dependencias..."
npm install

echo "🔐 Verificando configuración de firewall..."
if ! sudo ufw status | grep -q "443/tcp.*ALLOW"; then
    echo "   Abriendo puerto 443 (HTTPS)..."
    sudo ufw allow 443/tcp
fi
if ! sudo ufw status | grep -q "80/tcp.*ALLOW"; then
    echo "   Abriendo puerto 80 (HTTP)..."
    sudo ufw allow 80/tcp
fi

echo "🔒 Verificando certificado SSL..."
if [ ! -f /etc/letsencrypt/live/apps.movingenia.com/fullchain.pem ]; then
    echo "   ⚠️  Certificado SSL no encontrado. Instalando certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
    echo "   📜 Generando certificado SSL..."
    sudo certbot --nginx -d apps.movingenia.com --non-interactive --agree-tos --email admin@movingenia.com --redirect
else
    echo "   ✅ Certificado SSL ya existe"
fi

echo "⚙️  Verificando archivo .env del backend..."
if [ ! -f apps/backend/.env ]; then
    echo "   ⚠️  Archivo .env no encontrado. Creando desde .env.example..."
    if [ -f .env.example ]; then
        cp .env.example apps/backend/.env
    else
        echo "   ❌ ERROR: No existe .env.example. Debes crear manualmente apps/backend/.env"
        exit 1
    fi
fi

# Verificar que existan las variables críticas
echo "   Verificando variables de entorno críticas..."
if ! grep -q "^JWT_SECRET=" apps/backend/.env; then
    echo "   ⚠️  Agregando JWT_SECRET..."
    echo 'JWT_SECRET="monitoreo-jwt-secret-2024"' >> apps/backend/.env
fi
if ! grep -q "^JWT_REFRESH_SECRET=" apps/backend/.env; then
    echo "   ⚠️  Agregando JWT_REFRESH_SECRET..."
    echo 'JWT_REFRESH_SECRET="monitoreo-jwt-refresh-secret-2024"' >> apps/backend/.env
fi
if ! grep -q "^DATABASE_URL=" apps/backend/.env; then
    echo "   ⚠️  Agregando DATABASE_URL..."
    echo 'DATABASE_URL="postgresql://transito:transito@dbsrv.movingenia.com:5432/monitoreo?schema=public"' >> apps/backend/.env
fi
if ! grep -q "^NODE_ENV=" apps/backend/.env; then
    echo "   ⚠️  Agregando NODE_ENV..."
    echo 'NODE_ENV="production"' >> apps/backend/.env
fi
if ! grep -q "^PORT=" apps/backend/.env; then
    echo "   ⚠️  Agregando PORT..."
    echo 'PORT=3000' >> apps/backend/.env
fi

echo "⚙️  Configurando .env.production del frontend..."
echo 'VITE_API_URL=https://apps.movingenia.com/api' > apps/frontend/.env.production

echo "🗄️  Ejecutando migraciones de base de datos..."
cd ~/monitoreo-apirest
bash scripts/ejecutar-migraciones.sh || echo "⚠️  Revisar logs de migraciones"

echo "🔧 Generando Prisma Client..."
cd ~/monitoreo-apirest/apps/backend
npx prisma generate

echo "📋 Copiando archivos de Prisma Client..."
cd ~/monitoreo-apirest
mkdir -p .prisma apps/backend/.prisma
cp -r node_modules/.prisma/client .prisma/ 2>/dev/null || true
cp -r node_modules/.prisma/client apps/backend/.prisma/ 2>/dev/null || true

echo "��️  Compilando backend (sin .env para runtime loading)..."
cd ~/monitoreo-apirest/apps/backend
mv .env .env.backup 2>/dev/null || true
npm run build
mv .env.backup .env 2>/dev/null || true

echo "🎨 Compilando frontend..."
cd ~/monitoreo-apirest/apps/frontend
npm run build

echo "📝 Creando ecosystem.config.js para PM2..."
cd ~/monitoreo-apirest
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'monitoreo-backend',
    cwd: '/home/daddyplayerperu/monitoreo-apirest/apps/backend',
    script: 'node',
    args: '-r dotenv/config dist/main.js',
    env: {
      DOTENV_CONFIG_PATH: '.env'
    },
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

echo "🌐 Verificando configuración de Nginx..."
NGINX_CONFIG="/etc/nginx/sites-available/monitoreo"
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "   Creando configuración de Nginx..."
    sudo tee $NGINX_CONFIG > /dev/null << 'NGINX_EOF'
server {
    listen 80;
    server_name apps.movingenia.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name apps.movingenia.com;
    
    ssl_certificate /etc/letsencrypt/live/apps.movingenia.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/apps.movingenia.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    
    root /home/daddyplayerperu/monitoreo-apirest/apps/frontend/dist;
    index index.html;
    
    access_log /var/log/nginx/monitoreo-access.log;
    error_log /var/log/nginx/monitoreo-error.log;
    
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF
    sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/monitoreo
fi

echo "🔄 Verificando configuración de Nginx..."
sudo nginx -t

echo "🔄 Recargando Nginx..."
sudo systemctl reload nginx

echo "🛑 Deteniendo procesos PM2 anteriores..."
pm2 delete all 2>/dev/null || echo "No hay procesos que detener"

echo "▶️  Iniciando backend con PM2..."
pm2 start ecosystem.config.js

echo "💾 Guardando configuración PM2..."
pm2 save

echo "🔄 Configurando PM2 para inicio automático..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u daddyplayerperu --hp /home/daddyplayerperu 2>/dev/null || echo "PM2 startup ya configurado"

echo "⏳ Esperando que el backend inicie..."
sleep 5

echo "�� Estado de PM2:"
pm2 status

echo ""
echo "🧪 Probando endpoints..."
echo "   Backend Health Check:"
curl -s -k https://apps.movingenia.com/api 2>&1 | head -1 || echo "   ⚠️  Backend no responde aún"

echo ""
echo "✅ Despliegue completado"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 URLs:"
echo "   Frontend: https://apps.movingenia.com"
echo "   Backend:  https://apps.movingenia.com/api"
echo "   Swagger:  https://apps.movingenia.com/docs"
echo ""
echo "🔒 SSL:"
echo "   Certificado: Let's Encrypt"
echo "   Renovación automática: Configurada"
echo ""
echo "📝 Comandos útiles:"
echo "   Ver logs:              pm2 logs monitoreo-backend"
echo "   Reiniciar backend:     pm2 restart monitoreo-backend"
echo "   Estado:                pm2 status"
echo "   Logs Nginx:            sudo tail -f /var/log/nginx/monitoreo-*.log"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
ENDSSH

echo ""
echo "🎉 ¡Despliegue finalizado exitosamente!"
echo ""
