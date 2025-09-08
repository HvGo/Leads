#!/bin/bash

# Script de despliegue para DigitalOcean
# Ejecutar en el droplet después de subir el código

set -e  # Salir si hay errores

echo "🚀 ===== DESPLIEGUE CRM EN PRODUCCIÓN ====="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables
APP_DIR="/var/www/crm"
SERVICE_NAME="crm-api"
PORT=3001

echo -e "${BLUE}📋 Verificando requisitos...${NC}"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    echo "Instalar con: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version) y npm $(npm --version) disponibles${NC}"

echo -e "${BLUE}🔧 Configurando aplicación...${NC}"

# Instalar dependencias
echo "Instalando dependencias..."
npm install --production

# Verificar archivo .env
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️ Archivo .env no encontrado${NC}"
    if [ -f ".env.production" ]; then
        echo "Copiando .env.production como .env..."
        cp .env.production .env
        echo -e "${YELLOW}🔧 IMPORTANTE: Edita .env con tus credenciales reales${NC}"
    else
        echo -e "${RED}❌ No se encontró .env.production${NC}"
        exit 1
    fi
fi

# Generar JWT_SECRET si no existe
if ! grep -q "JWT_SECRET=" .env || grep -q "JWT_SECRET=tu_jwt_secret" .env; then
    echo "Generando JWT_SECRET..."
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    echo -e "${GREEN}✅ JWT_SECRET generado${NC}"
fi

# Configurar firewall
echo -e "${BLUE}🔥 Configurando firewall...${NC}"
sudo ufw allow $PORT/tcp
sudo ufw --force enable

# Crear directorio de logs
mkdir -p logs

# Ejecutar migración de contraseñas
echo -e "${BLUE}🔐 Ejecutando migración de contraseñas...${NC}"
npm run db:migrate-passwords

# Construir aplicación
echo -e "${BLUE}🏗️ Construyendo aplicación...${NC}"
NODE_ENV=production npm run build

# Instalar PM2 si no está disponible
if ! command -v pm2 &> /dev/null; then
    echo "Instalando PM2..."
    sudo npm install -g pm2
fi

# Crear archivo de configuración PM2 (CommonJS)
cat > ecosystem.config.cjs << EOF
module.exports = {
  apps: [{
    name: '$SERVICE_NAME',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: $PORT
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Detener proceso anterior si existe
pm2 delete $SERVICE_NAME 2>/dev/null || true

# Iniciar aplicación con PM2
echo -e "${BLUE}🚀 Iniciando aplicación...${NC}"
pm2 start ecosystem.config.cjs

# Configurar PM2 para inicio automático
pm2 startup
pm2 save

# Verificar estado
sleep 3
pm2 status

# Probar conectividad
echo -e "${BLUE}🧪 Probando conectividad...${NC}"
sleep 2

# Health check local
if curl -f http://localhost:$PORT/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check local exitoso${NC}"
else
    echo -e "${RED}❌ Health check local falló${NC}"
    pm2 logs $SERVICE_NAME --lines 20
    exit 1
fi

# Obtener IP pública
PUBLIC_IP=$(curl -s ifconfig.me)

echo ""
echo -e "${GREEN}🎉 ===== DESPLIEGUE COMPLETADO ====="
echo -e "🌐 Aplicación disponible en: http://$PUBLIC_IP:$PORT"
echo -e "📊 API Health Check: http://$PUBLIC_IP:$PORT/api/health"
echo -e "🔑 Credenciales por defecto: admin@crm.com / admin123"
echo ""
echo -e "${YELLOW}📋 COMANDOS ÚTILES:"
echo -e "Ver logs: pm2 logs $SERVICE_NAME"
echo -e "Reiniciar: pm2 restart $SERVICE_NAME"
echo -e "Detener: pm2 stop $SERVICE_NAME"
echo -e "Estado: pm2 status"
echo -e "Monitoreo: pm2 monit${NC}"
echo ""
echo -e "${BLUE}🔧 PRÓXIMOS PASOS:"
echo -e "1. Configura tu dominio para apuntar a $PUBLIC_IP"
echo -e "2. Considera configurar SSL/HTTPS con Let's Encrypt"
echo -e "3. Configura backups automáticos de la base de datos${NC}"
