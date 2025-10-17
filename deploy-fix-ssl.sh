#!/bin/bash

echo "🚀 DESPLEGANDO FIX PARA ERRORES SSL"
echo "===================================="
echo ""

# 1. Subir cambios a Git (si usas Git)
echo "📤 1. Preparando archivos..."
# git add server.js
# git commit -m "Fix: Deshabilitar SSL forzado en HTTP"
# git push

# 2. En el servidor, actualizar código
echo ""
echo "📥 2. En tu droplet, ejecuta estos comandos:"
echo ""
echo "   # Detener servidor"
echo "   pm2 stop crm-api"
echo ""
echo "   # Actualizar código (si usas Git)"
echo "   # git pull"
echo ""
echo "   # O copiar server.js manualmente"
echo ""
echo "   # Reiniciar servidor"
echo "   pm2 restart crm-api"
echo ""
echo "   # Ver logs"
echo "   pm2 logs crm-api --lines 20"
echo ""

echo "✅ Cambios realizados en server.js:"
echo "   - Helmet completamente deshabilitado"
echo "   - Headers SSL removidos (HSTS, Upgrade-Insecure-Requests)"
echo "   - CSP configurado para permitir HTTP"
echo "   - Origin-Agent-Cluster configurado como opcional"
echo ""

echo "🌐 Después de reiniciar, prueba:"
echo "   http://159.65.169.239:3001"
echo ""
echo "   Y verifica en DevTools (F12) que:"
echo "   ✅ No haya errores ERR_SSL_PROTOCOL_ERROR"
echo "   ✅ Los archivos .js carguen con status 200"
echo "   ✅ La consola no muestre errores"
echo ""
