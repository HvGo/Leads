import dotenv from 'dotenv';
import pkg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pkg;

// Cargar variables de entorno
dotenv.config();

// Configuración de la base de datos
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

const SALT_ROUNDS = 12;

async function migratePasswords() {
  const client = await pool.connect();
  
  try {
    console.log('🔐 Iniciando migración de contraseñas...');
    
    // Obtener todos los usuarios con contraseñas en texto plano
    const result = await client.query(`
      SELECT id, email, password 
      FROM users 
      WHERE password IS NOT NULL AND password != ''
    `);
    
    console.log(`📊 Encontrados ${result.rows.length} usuarios para migrar`);
    
    for (const user of result.rows) {
      try {
        // Verificar si la contraseña ya está hasheada (bcrypt hashes empiezan con $2b$)
        if (user.password.startsWith('$2b$')) {
          console.log(`✅ Usuario ${user.email} ya tiene contraseña hasheada`);
          continue;
        }
        
        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
        
        // Actualizar en la base de datos
        await client.query(
          'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [hashedPassword, user.id]
        );
        
        console.log(`🔒 Contraseña migrada para: ${user.email}`);
        
      } catch (error) {
        console.error(`❌ Error migrando usuario ${user.email}:`, error.message);
      }
    }
    
    console.log('✅ Migración de contraseñas completada');
    
  } catch (error) {
    console.error('❌ Error en la migración:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar migración
migratePasswords();
