import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verifyPassword() {
  try {
    console.log('\n🔐 VERIFICANDO CONTRASEÑA DEL ADMIN\n');
    console.log('='.repeat(50));
    
    // 1. Obtener el hash actual de la base de datos
    const result = await pool.query(
      'SELECT id, email, name, password, status FROM users WHERE email = $1',
      ['admin@crm.com']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Usuario admin@crm.com no encontrado');
      await pool.end();
      return;
    }
    
    const user = result.rows[0];
    console.log('\n✅ Usuario encontrado:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Estado: ${user.status}`);
    console.log(`   Hash en DB: ${user.password.substring(0, 20)}...`);
    
    // 2. Probar diferentes contraseñas
    const passwordsToTest = ['admin123', 'Admin123', 'admin', 'password'];
    
    console.log('\n🧪 Probando contraseñas comunes:\n');
    
    for (const testPassword of passwordsToTest) {
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log(`   ${isValid ? '✅' : '❌'} "${testPassword}": ${isValid ? 'VÁLIDA' : 'inválida'}`);
      
      if (isValid) {
        console.log('\n🎉 ¡CONTRASEÑA ENCONTRADA!');
        console.log(`   Email: admin@crm.com`);
        console.log(`   Password: ${testPassword}`);
        await pool.end();
        return;
      }
    }
    
    console.log('\n❌ Ninguna contraseña común funcionó');
    console.log('\n💡 SOLUCIÓN: Ejecuta el script de reset:');
    console.log('   node reset-admin-password.js');
    
    await pool.end();
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await pool.end();
    process.exit(1);
  }
}

verifyPassword();
