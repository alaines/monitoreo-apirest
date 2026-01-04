#!/bin/bash
# ============================================
# Script de Instalación Automática - Producción
# Sistema de Monitoreo de Tránsito
# ============================================

set -e  # Detener en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Sistema de Monitoreo - Instalación en Producción    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# 1. VERIFICAR REQUISITOS
# ============================================
echo -e "${YELLOW}[1/10]${NC} Verificando requisitos previos..."

# Verificar si se ejecuta como root o con sudo
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}✗ Este script debe ejecutarse con sudo${NC}"
   echo "  Ejecutar: sudo $0"
   exit 1
fi

# Obtener el usuario real (no root)
REAL_USER=${SUDO_USER:-$USER}
USER_HOME=$(eval echo ~$REAL_USER)

echo -e "${GREEN}✓ Usuario: $REAL_USER${NC}"
echo -e "${GREEN}✓ Directorio home: $USER_HOME${NC}"

# ============================================
# 2. INSTALAR NODE.JS
# ============================================
echo -e "\n${YELLOW}[2/10]${NC} Instalando Node.js 20..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js ya instalado: $NODE_VERSION${NC}"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo -e "${GREEN}✓ Node.js instalado: $(node --version)${NC}"
fi

# ============================================
# 3. INSTALAR POSTGRESQL + POSTGIS
# ============================================
echo -e "\n${YELLOW}[3/10]${NC} Instalando PostgreSQL y PostGIS..."

if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    echo -e "${GREEN}✓ PostgreSQL ya instalado: $PSQL_VERSION${NC}"
else
    apt-get install -y postgresql postgresql-contrib postgis
    echo -e "${GREEN}✓ PostgreSQL instalado${NC}"
fi

# Iniciar PostgreSQL si no está corriendo
systemctl start postgresql
systemctl enable postgresql

# ============================================
# 4. CONFIGURAR BASE DE DATOS
# ============================================
echo -e "\n${YELLOW}[4/10]${NC} Configurando base de datos..."

# Solicitar contraseña para DB
echo -e "${BLUE}Ingrese contraseña para usuario 'transito' de PostgreSQL:${NC}"
read -s DB_PASSWORD
echo ""

# Crear base de datos y usuario
sudo -u postgres psql << EOF
-- Crear base de datos
DROP DATABASE IF EXISTS monitoreo;
CREATE DATABASE monitoreo;

-- Crear usuario
DROP USER IF EXISTS transito;
CREATE USER transito WITH PASSWORD '$DB_PASSWORD';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE monitoreo TO transito;

-- Conectar a la base de datos y habilitar PostGIS
\c monitoreo
CREATE EXTENSION IF NOT EXISTS postgis;
GRANT ALL ON SCHEMA public TO transito;

SELECT 'Base de datos configurada exitosamente!' as mensaje;
EOF

echo -e "${GREEN}✓ Base de datos 'monitoreo' creada${NC}"

# ============================================
# 5. CLONAR REPOSITORIO
# ============================================
echo -e "\n${YELLOW}[5/10]${NC} Clonando repositorio..."

PROJECT_DIR="$USER_HOME/monitoreo-apirest"

if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}⚠ Directorio ya existe. Actualizando...${NC}"
    cd "$PROJECT_DIR"
    sudo -u $REAL_USER git pull origin main
else
    cd "$USER_HOME"
    sudo -u $REAL_USER git clone https://github.com/alaines/monitoreo-apirest.git
    echo -e "${GREEN}✓ Repositorio clonado${NC}"
fi

cd "$PROJECT_DIR"

# ============================================
# 6. INSTALAR DEPENDENCIAS
# ============================================
echo -e "\n${YELLOW}[6/10]${NC} Instalando dependencias npm..."

sudo -u $REAL_USER npm install
echo -e "${GREEN}✓ Dependencias instaladas${NC}"

# ============================================
# 7. CONFIGURAR VARIABLES DE ENTORNO
# ============================================
echo -e "\n${YELLOW}[7/10]${NC} Configurando variables de entorno..."

# Solicitar dominio
echo -e "${BLUE}Ingrese el dominio (ej: apps.movingenia.com) o presione Enter para usar localhost:${NC}"
read DOMAIN
DOMAIN=${DOMAIN:-localhost}

# Generar JWT secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Crear archivo .env
cat > .env << EOF
# Base de Datos
DATABASE_URL=postgresql://transito:$DB_PASSWORD@localhost:5432/monitoreo?schema=public

# JWT Secrets
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_EXPIRES_IN=7d

# Backend
PORT=3001
NODE_ENV=production
HOST=0.0.0.0

# Frontend
VITE_API_URL=http://$DOMAIN/api
EOF

chown $REAL_USER:$REAL_USER .env
chmod 600 .env

echo -e "${GREEN}✓ Variables de entorno configuradas${NC}"

# ============================================
# 8. APLICAR SCHEMA Y DATOS INICIALES
# ============================================
echo -e "\n${YELLOW}[8/10]${NC} Aplicando schema y datos iniciales..."

# Aplicar schema
PGPASSWORD=$DB_PASSWORD psql -U transito -d monitoreo -f database/current-schema.sql > /dev/null 2>&1
echo -e "${GREEN}✓ Schema aplicado${NC}"

# Cargar datos iniciales
PGPASSWORD=$DB_PASSWORD psql -U transito -d monitoreo -f database/init.sql
echo -e "${GREEN}✓ Datos iniciales cargados${NC}"

# ============================================
# 9. COMPILAR APLICACIÓN
# ============================================
echo -e "\n${YELLOW}[9/10]${NC} Compilando aplicación..."

# Generar Prisma Client
cd apps/backend
sudo -u $REAL_USER npx prisma generate > /dev/null 2>&1
echo -e "${GREEN}✓ Prisma Client generado${NC}"

# Compilar backend
sudo -u $REAL_USER npm run build
echo -e "${GREEN}✓ Backend compilado${NC}"

# Compilar frontend
cd ../frontend
sudo -u $REAL_USER npm run build
echo -e "${GREEN}✓ Frontend compilado${NC}"

cd ../..

# ============================================
# 10. CONFIGURAR PM2 Y SERVICIOS
# ============================================
echo -e "\n${YELLOW}[10/10]${NC} Configurando PM2 y servicios..."

# Instalar PM2 globalmente
npm install -g pm2
echo -e "${GREEN}✓ PM2 instalado${NC}"

# Crear directorio de logs
mkdir -p logs
chown -R $REAL_USER:$REAL_USER logs

# Detener procesos anteriores si existen
sudo -u $REAL_USER pm2 delete all 2>/dev/null || true

# Iniciar servicios con PM2
sudo -u $REAL_USER pm2 start ecosystem.config.js

# Guardar configuración
sudo -u $REAL_USER pm2 save

# Configurar inicio automático
env PATH=$PATH:/usr/bin pm2 startup systemd -u $REAL_USER --hp $USER_HOME

echo -e "${GREEN}✓ Servicios iniciados con PM2${NC}"

# ============================================
# RESUMEN FINAL
# ============================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✓ Instalación Completada Exitosamente       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Estado de Servicios:${NC}"
sudo -u $REAL_USER pm2 status

echo ""
echo -e "${BLUE}🌐 URLs de Acceso:${NC}"
echo -e "   Frontend: http://$DOMAIN"
echo -e "   Backend:  http://$DOMAIN/api"
echo -e "   Docs:     http://$DOMAIN/api/docs"

echo ""
echo -e "${BLUE}🔐 Credenciales Iniciales:${NC}"
echo -e "   Usuario:    ${GREEN}admin${NC}"
echo -e "   Contraseña: ${GREEN}Admin123${NC}"
echo -e "   ${YELLOW}⚠ ¡CAMBIAR DESPUÉS DEL PRIMER LOGIN!${NC}"

echo ""
echo -e "${BLUE}📝 Comandos Útiles:${NC}"
echo -e "   Ver logs:      pm2 logs"
echo -e "   Estado:        pm2 status"
echo -e "   Reiniciar:     pm2 restart all"
echo -e "   Detener:       pm2 stop all"

echo ""
echo -e "${BLUE}📚 Próximos Pasos:${NC}"
echo -e "   1. Configurar Nginx (opcional): ver docs/INSTALLATION.md"
echo -e "   2. Configurar HTTPS con Let's Encrypt"
echo -e "   3. Cambiar contraseña del usuario admin"
echo -e "   4. Configurar backup automático de base de datos"

echo ""
echo -e "${YELLOW}⚠ IMPORTANTE:${NC}"
echo -e "   - Guardar la contraseña de la base de datos en un lugar seguro"
echo -e "   - Los JWT secrets se generaron automáticamente"
echo -e "   - Revisar el archivo .env para más configuraciones"

echo ""
