import dotenv from 'dotenv';
import pkg from 'pg';
import fs from 'fs';
import { promisify } from 'util';

const { Pool } = pkg;

// Cargar variables de entorno
dotenv.config();

console.log('🔍 ===== DIAGNÓSTICO COMPLETO DEL SERVIDOR =====\n');

// 1. Verificar variables de entorno críticas
console.log('📋 1. VARIABLES DE ENTORNO:');
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'PORT',
  'NODE_ENV'
];

const optionalEnvVars = [
  'FRONTEND_URL',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'DB_SSL'
];

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`   ${value ? '✅' : '❌'} ${varName}: ${value ? 'SET' : 'NOT SET'}`);
});

console.log('\n📋 Variables opcionales:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`   ${value ? '✅' : '⚠️'} ${varName}: ${value ? 'SET' : 'NOT SET'}`);
});

// 2. Verificar conexión a base de datos
console.log('\n🐘 2. CONEXIÓN A BASE DE DATOS:');
const pool = new Pool({
  ...(process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
  } : {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'crm_system',
    password: String(process.env.DB_PASSWORD || ''),
    port: parseInt(process.env.DB_PORT) || 5432,
  }),
  ssl: process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true' || process.env.DATABASE_URL?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false,
});

try {
  const client = await pool.connect();
  console.log('   ✅ Conexión a PostgreSQL exitosa');
  
  // Verificar tablas críticas
  const tablesResult = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  
  const tables = tablesResult.rows.map(row => row.table_name);
  const requiredTables = ['users', 'roles', 'permissions', 'leads', 'interactions'];
  
  console.log('   📊 Tablas encontradas:', tables.join(', '));
  
  requiredTables.forEach(table => {
    const exists = tables.includes(table);
    console.log(`   ${exists ? '✅' : '❌'} Tabla ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
  });
  
  // Verificar usuarios con contraseñas hasheadas
  const usersResult = await client.query(`
    SELECT 
      email, 
      CASE 
        WHEN password LIKE '$2b$%' THEN 'HASHED'
        ELSE 'PLAINTEXT'
      END as password_status
    FROM users 
    LIMIT 5
  `);
  
  console.log('\n   👥 Estado de contraseñas de usuarios:');
  usersResult.rows.forEach(user => {
    console.log(`   ${user.password_status === 'HASHED' ? '✅' : '❌'} ${user.email}: ${user.password_status}`);
  });
  
  client.release();
} catch (error) {
  console.log('   ❌ Error conectando a PostgreSQL:', error.message);
}

// 3. Verificar archivos críticos
console.log('\n📁 3. ARCHIVOS DEL SISTEMA:');
const criticalFiles = [
  'server.js',
  'package.json',
  '.env',
  'src/utils/auth.js',
  'src/middleware/auth.js',
  'src/middleware/validation.js',
  'src/middleware/errorHandler.js'
];

criticalFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? '✅' : '❌'} ${file}: ${exists ? 'EXISTS' : 'MISSING'}`);
});

// 4. Verificar directorio de logs
console.log('\n📝 4. SISTEMA DE LOGS:');
const logsDir = 'logs';
const logsDirExists = fs.existsSync(logsDir);
console.log(`   ${logsDirExists ? '✅' : '❌'} Directorio logs: ${logsDirExists ? 'EXISTS' : 'MISSING'}`);

if (logsDirExists) {
  const logFiles = fs.readdirSync(logsDir);
  console.log(`   📄 Archivos de log: ${logFiles.length > 0 ? logFiles.join(', ') : 'NONE'}`);
}

// 5. Verificar configuración de red
console.log('\n🌐 5. CONFIGURACIÓN DE RED:');
const port = process.env.PORT || 3001;
console.log(`   🔌 Puerto configurado: ${port}`);
console.log(`   🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// 6. Generar recomendaciones
console.log('\n💡 6. RECOMENDACIONES:');

if (!process.env.JWT_SECRET) {
  console.log('   ⚠️  Configurar JWT_SECRET en .env');
}

if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
  console.log('   ⚠️  Configurar DATABASE_URL o parámetros individuales de DB');
}

if (!fs.existsSync('.env')) {
  console.log('   ⚠️  Crear archivo .env basado en .env.example');
}

if (!fs.existsSync('logs')) {
  console.log('   ⚠️  El directorio logs se creará automáticamente');
}

// 7. Comandos útiles para DigitalOcean
console.log('\n🔧 7. COMANDOS PARA DIGITALOCEAN:');
console.log('   Verificar puerto abierto:');
console.log(`   sudo ss -tuln | grep :${port}`);
console.log('\n   Verificar firewall UFW:');
console.log(`   sudo ufw status | grep ${port}`);
console.log('\n   Verificar proceso Node.js:');
console.log('   ps aux | grep node');
console.log('\n   Probar conectividad externa:');
console.log(`   curl -I http://YOUR_DROPLET_IP:${port}/api/health`);
console.log('\n   Ver logs del servidor:');
console.log('   tail -f logs/combined.log');

console.log('\n✅ ===== DIAGNÓSTICO COMPLETADO =====');

await pool.end();
