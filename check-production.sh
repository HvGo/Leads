#!/bin/bash

echo ""
echo "🔍 DIAGNÓSTICO DE PRODUCCIÓN - PÁGINA EN BLANCO"
echo "============================================================"

# 1. Verificar logs de PM2
echo ""
echo "📋 1. LOGS DE PM2 (últimas 30 líneas):"
echo "------------------------------------------------------------"
pm2 logs crm-api --lines 30 --nostream

# 2. Verificar build
echo ""
echo "📦 2. VERIFICANDO BUILD:"
echo "------------------------------------------------------------"
if [ -d "dist" ]; then
    echo "✅ Directorio dist/ existe"
    
    if [ -f "dist/index.html" ]; then
        echo "✅ dist/index.html existe"
        echo ""
        echo "Contenido de index.html (primeras 20 líneas):"
        head -20 dist/index.html
    else
        echo "❌ dist/index.html NO EXISTE"
        echo "   Solución: npm run build"
    fi
    
    echo ""
    echo "Archivos en dist/:"
    ls -lh dist/
    
    if [ -d "dist/assets" ]; then
        echo ""
        echo "Archivos en dist/assets/:"
        ls -lh dist/assets/ | head -10
    fi
else
    echo "❌ Directorio dist/ NO EXISTE"
    echo "   Solución: npm run build"
fi

# 3. Verificar servidor
echo ""
echo "🖥️  3. PROBANDO ENDPOINTS:"
echo "------------------------------------------------------------"

echo "Test endpoint (/test):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3001/test

echo ""
echo "Health endpoint (/api/health):"
curl -s http://localhost:3001/api/health | head -5

echo ""
echo "Index.html (/):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3001/

# 4. Verificar archivos JavaScript
echo ""
echo "📄 4. VERIFICANDO CARGA DE ASSETS:"
echo "------------------------------------------------------------"
if [ -f "dist/index.html" ]; then
    # Extraer ruta del script principal
    SCRIPT_PATH=$(grep -o 'src="[^"]*\.js"' dist/index.html | head -1 | sed 's/src="//;s/"//')
    
    if [ ! -z "$SCRIPT_PATH" ]; then
        echo "Script principal encontrado: $SCRIPT_PATH"
        echo "Probando carga del script:"
        
        # Remover / inicial si existe
        CLEAN_PATH=${SCRIPT_PATH#/}
        
        if [ -f "dist/$CLEAN_PATH" ]; then
            FILE_SIZE=$(stat -f%z "dist/$CLEAN_PATH" 2>/dev/null || stat -c%s "dist/$CLEAN_PATH" 2>/dev/null)
            echo "✅ Archivo existe localmente (${FILE_SIZE} bytes)"
        else
            echo "❌ Archivo NO existe en dist/$CLEAN_PATH"
        fi
        
        # Probar desde el servidor
        curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "http://localhost:3001/$SCRIPT_PATH"
    fi
fi

# 5. Verificar proceso
echo ""
echo "⚙️  5. INFORMACIÓN DEL PROCESO:"
echo "------------------------------------------------------------"
pm2 info crm-api | grep -E "status|uptime|restarts|memory|cpu"

# 6. Verificar puerto
echo ""
echo "🔌 6. VERIFICANDO PUERTO 3001:"
echo "------------------------------------------------------------"
netstat -tuln | grep 3001 || ss -tuln | grep 3001

echo ""
echo "============================================================"
echo "✅ Diagnóstico completado"
echo ""
echo "🌐 SIGUIENTE PASO: Verificar en el navegador"
echo "   1. Abre: http://159.65.169.239:3001"
echo "   2. Presiona F12 (DevTools)"
echo "   3. Ve a la pestaña Console - busca errores"
echo "   4. Ve a la pestaña Network - verifica que los .js carguen"
echo "   5. Toma screenshot si hay errores"
echo ""
