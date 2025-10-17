import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function cleanDuplicatePermissions() {
  try {
    console.log('\n🧹 LIMPIANDO PERMISOS DUPLICADOS\n');
    console.log('='.repeat(50));
    
    // 1. Verificar permisos duplicados
    console.log('\n📊 Verificando permisos duplicados...');
    const duplicates = await pool.query(`
      SELECT role_id, permission_id, COUNT(*) as count
      FROM role_permissions
      GROUP BY role_id, permission_id
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.rows.length === 0) {
      console.log('✅ No hay permisos duplicados');
      await pool.end();
      return;
    }
    
    console.log(`⚠️  Encontrados ${duplicates.rows.length} permisos duplicados:`);
    duplicates.rows.forEach(dup => {
      console.log(`   - Role ID: ${dup.role_id}, Permission ID: ${dup.permission_id}, Count: ${dup.count}`);
    });
    
    // 2. Eliminar duplicados (mantener solo el primero)
    console.log('\n🗑️  Eliminando duplicados...');
    const deleteResult = await pool.query(`
      WITH duplicates AS (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY role_id, permission_id ORDER BY id) as rn
        FROM role_permissions
      )
      DELETE FROM role_permissions
      WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
      )
    `);
    
    console.log(`✅ Eliminados ${deleteResult.rowCount} registros duplicados`);
    
    // 3. Verificar resultado
    console.log('\n📊 Verificando resultado...');
    const totalPermissions = await pool.query('SELECT COUNT(*) as total FROM role_permissions');
    const uniquePermissions = await pool.query(`
      SELECT COUNT(*) as total 
      FROM (
        SELECT DISTINCT role_id, permission_id 
        FROM role_permissions
      ) as unique_perms
    `);
    
    console.log(`   Total de permisos: ${totalPermissions.rows[0].total}`);
    console.log(`   Permisos únicos: ${uniquePermissions.rows[0].total}`);
    
    if (totalPermissions.rows[0].total === uniquePermissions.rows[0].total) {
      console.log('\n✅ LIMPIEZA COMPLETADA - No hay duplicados');
    } else {
      console.log('\n⚠️  Aún hay duplicados, ejecuta el script nuevamente');
    }
    
    // 4. Mostrar resumen de permisos por rol
    console.log('\n📋 Resumen de permisos por rol:');
    const summary = await pool.query(`
      SELECT 
        r.name as role_name,
        r.display_name,
        COUNT(rp.permission_id) as permission_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id, r.name, r.display_name
      ORDER BY r.name
    `);
    
    summary.rows.forEach(row => {
      console.log(`   - ${row.display_name} (${row.role_name}): ${row.permission_count} permisos`);
    });
    
    await pool.end();
    console.log('\n✅ Conexión cerrada\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nDetalles:', error);
    await pool.end();
    process.exit(1);
  }
}

cleanDuplicatePermissions();
