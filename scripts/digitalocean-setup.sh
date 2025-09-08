#!/bin/bash

echo "🚀 ===== CONFIGURACIÓN DIGITALOCEAN DROPLET ====="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. VERIFICAR ESTADO ACTUAL${NC}"
echo "Verificando puerto 3001..."
sudo ss -tuln | grep :3001
echo ""

echo "Verificando firewall UFW..."
sudo ufw status | grep 3001
echo ""

echo "Verificando procesos Node.js..."
ps aux | grep node
echo ""

echo -e "${YELLOW}2. CONFIGURAR FIREWALL${NC}"
echo "Abriendo puerto 3001..."
sudo ufw allow 3001/tcp
sudo ufw status
echo ""

echo -e "${YELLOW}3. VERIFICAR VARIABLES DE ENTORNO${NC}"
echo "Verificando archivo .env..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ Archivo .env encontrado${NC}"
    echo "Contenido (sin valores sensibles):"
    grep -E "^[A-Z_]+" .env | sed 's/=.*/=***/' | head -10
else
    echo -e "${RED}❌ Archivo .env NO encontrado${NC}"
    echo "Copia .env.production como .env y configúralo"
fi
echo ""

echo -e "${YELLOW}4. INSTALAR DEPENDENCIAS${NC}"
echo "Instalando dependencias de Node.js..."
npm install
echo ""

echo -e "${YELLOW}5. EJECUTAR DIAGNÓSTICO${NC}"
echo "Ejecutando script de diagnóstico..."
npm run diagnose
echo ""

echo -e "${YELLOW}6. PROBAR CONECTIVIDAD EXTERNA${NC}"
echo "Para probar desde otra máquina, ejecuta:"
echo "curl -I http://$(curl -s ifconfig.me):3001/api/health"
echo ""

echo -e "${YELLOW}7. COMANDOS ÚTILES${NC}"
echo "Iniciar servidor en producción:"
echo "NODE_ENV=production npm run server"
echo ""
echo "Ver logs en tiempo real:"
echo "tail -f logs/combined.log"
echo ""
echo "Verificar que el servidor esté escuchando en 0.0.0.0:"
echo "sudo netstat -tlnp | grep :3001"
echo ""
echo "Reiniciar servidor con PM2 (recomendado para producción):"
echo "npm install -g pm2"
echo "NODE_ENV=production pm2 start server.js --name crm-api"
echo "pm2 startup"
echo "pm2 save"
echo ""

echo -e "${GREEN}✅ Configuración completada${NC}"
echo "Recuerda:"
echo "1. Configurar .env con tus credenciales reales"
echo "2. Generar JWT_SECRET seguro"
echo "3. Actualizar FRONTEND_URL y BACKEND_URL con tu IP real"
echo "4. Ejecutar migración de contraseñas: npm run db:migrate-passwords"
