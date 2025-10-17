#!/bin/bash

echo "🔧 FIX DE BASE DE DATOS Y TEST DE LOGIN"
echo "========================================"
echo ""

# Conectar a la base de datos y ejecutar queries
echo "📊 1. VERIFICANDO Y LIMPIANDO BASE DE DATOS"
echo "------------------------------------------------"
echo ""

# Cargar variables de entorno
if [ -f .env.production ]; then
    export $(grep -v '^#' .env.production | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL no está configurada"
    echo "   Configura la variable en .env.production"
    exit 1
fi

echo "✅ DATABASE_URL encontrada"
echo ""

# Ejecutar queries directamente
echo "📋 Verificando usuarios activos..."
psql "$DATABASE_URL" -c "SELECT id, email, name, status FROM users WHERE status = 'ACTIVE';"

echo ""
echo "📋 Verificando roles..."
psql "$DATABASE_URL" -c "SELECT id, name, display_name FROM roles;"

echo ""
echo "🔍 Buscando permisos duplicados..."
psql "$DATABASE_URL" -c "
SELECT role_id, permission_id, COUNT(*) as duplicates
FROM role_permissions
GROUP BY role_id, permission_id
HAVING COUNT(*) > 1;
"

echo ""
echo "🗑️  Limpiando permisos duplicados..."
psql "$DATABASE_URL" << 'EOSQL'
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY role_id, permission_id ORDER BY id) as rn
  FROM role_permissions
)
DELETE FROM role_permissions
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
EOSQL

echo ""
echo "✅ Verificando resultado..."
psql "$DATABASE_URL" -c "SELECT COUNT(*) as total_permissions FROM role_permissions;"

echo ""

echo "📝 2. RESETEAR PASSWORD DEL ADMIN (si es necesario)"
echo "----------------------------------------------------"
echo ""
echo "Si no puedes hacer login, ejecuta en el droplet:"
echo ""
echo "node << 'EOF'"
echo "import bcrypt from 'bcrypt';"
echo "import pg from 'pg';"
echo "import dotenv from 'dotenv';"
echo ""
echo "dotenv.config({ path: '.env.production' });"
echo ""
echo "const pool = new pg.Pool({"
echo "  connectionString: process.env.DATABASE_URL,"
echo "  ssl: { rejectUnauthorized: false }"
echo "});"
echo ""
echo "async function resetAdminPassword() {"
echo "  try {"
echo "    const hashedPassword = await bcrypt.hash('admin123', 12);"
echo "    "
echo "    const result = await pool.query("
echo "      'UPDATE users SET password = \$1 WHERE email = \$2 RETURNING id, email, name',"
echo "      [hashedPassword, 'admin@crm.com']"
echo "    );"
echo "    "
echo "    if (result.rows.length > 0) {"
echo "      console.log('✅ Password reseteado para:', result.rows[0]);"
echo "      console.log('   Email: admin@crm.com');"
echo "      console.log('   Password: admin123');"
echo "    } else {"
echo "      console.log('❌ Usuario admin@crm.com no encontrado');"
echo "    }"
echo "    "
echo "    await pool.end();"
echo "  } catch (error) {"
echo "    console.error('Error:', error);"
echo "    await pool.end();"
echo "  }"
echo "}"
echo ""
echo "resetAdminPassword();"
echo "EOF"
echo ""

echo "🧪 3. PROBAR LOGIN DESDE CURL"
echo "------------------------------"
echo ""
echo "curl -X POST http://localhost:3001/api/auth/login \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\":\"admin@crm.com\",\"password\":\"admin123\"}'"
echo ""

echo "✅ 4. VERIFICAR LOGS DESPUÉS"
echo "----------------------------"
echo ""
echo "pm2 logs crm-api --lines 50"
echo ""
