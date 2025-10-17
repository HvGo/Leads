import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetAdminPassword() {
  try {
    console.log('\n🔐 RESETEANDO PASSWORD DEL ADMIN\n');
    console.log('='.repeat(50));
    
    // 1. Verificar que el usuario existe
    const checkUser = await pool.query(
      'SELECT id, email, name, status FROM users WHERE email = $1',
      ['admin@crm.com']
    );
    
    if (checkUser.rows.length === 0) {
      console.log('\n❌ Usuario admin@crm.com NO EXISTE');
      console.log('\n📋 Usuarios disponibles:');
      
      const allUsers = await pool.query('SELECT id, email, name, status FROM users LIMIT 10');
      allUsers.rows.forEach(user => {
        console.log(`   - ${user.email} (${user.status})`);
      });
      
      await pool.end();
      return;
    }
    
    console.log('\n✅ Usuario encontrado:');
    console.log(`   ID: ${checkUser.rows[0].id}`);
    console.log(`   Email: ${checkUser.rows[0].email}`);
    console.log(`   Nombre: ${checkUser.rows[0].name}`);
    console.log(`   Estado: ${checkUser.rows[0].status}`);
    
    // 2. Generar nueva contraseña hasheada
    console.log('\n🔄 Generando nuevo hash de contraseña...');
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // 3. Actualizar contraseña
    console.log('💾 Actualizando contraseña en la base de datos...');
    const result = await pool.query(
      'UPDATE users SET password = $1, status = $2 WHERE email = $3 RETURNING id, email, name, status',
      [hashedPassword, 'ACTIVE', 'admin@crm.com']
    );
    
    if (result.rows.length > 0) {
      console.log('\n✅ PASSWORD RESETEADO EXITOSAMENTE\n');
      console.log('='.repeat(50));
      console.log('\n📝 CREDENCIALES DE LOGIN:');
      console.log(`   Email:    admin@crm.com`);
      console.log(`   Password: admin123`);
      console.log(`   Estado:   ${result.rows[0].status}`);
      console.log('\n🌐 Prueba hacer login en:');
      console.log('   http://159.65.169.239:3001/login');
      console.log('\n='.repeat(50));
    } else {
      console.log('\n❌ No se pudo actualizar la contraseña');
    }
    
    await pool.end();
    console.log('\n✅ Conexión cerrada\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nDetalles:', error);
    await pool.end();
    process.exit(1);
  }
}

resetAdminPassword();
