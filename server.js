import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
const { Pool } = pkg;
import fs from 'fs';
import { promisify } from 'util';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

// Debug: Show environment variables (remove in production)
console.log('\n🔧 ===== ENVIRONMENT VARIABLES =====');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('PORT:', process.env.PORT || '3001');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('DB_HOST:', process.env.DB_HOST || 'NOT SET');
console.log('DB_PORT:', process.env.DB_PORT || 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME || 'NOT SET');
console.log('DB_USER:', process.env.DB_USER || 'NOT SET');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET' : 'NOT SET');
console.log('DB_SSL:', process.env.DB_SSL || 'NOT SET');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'NOT SET');
console.log('BACKEND_URL:', process.env.BACKEND_URL || 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('=====================================\n');

const app = express();
const PORT = process.env.PORT || 3001;

// Service validation utilities
const validateServices = async () => {
  const services = {
    database: { status: 'unknown', message: '', details: null },
    filesystem: { status: 'unknown', message: '', details: null },
    environment: { status: 'unknown', message: '', details: null },
    api: { status: 'unknown', message: '', details: null },
    frontend: { status: 'unknown', message: '', details: null }
  };

  console.log('\n🔍 ===== SERVICE VALIDATION =====');

  // 1. Database validation
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    const leadCount = await client.query('SELECT COUNT(*) as count FROM leads');

    services.database = {
      status: 'healthy',
      message: 'Database connection successful',
      details: {
        timestamp: result.rows[0].current_time,
        version: result.rows[0].db_version.split(' ')[0] + ' ' + result.rows[0].db_version.split(' ')[1],
        users: parseInt(userCount.rows[0].count),
        leads: parseInt(leadCount.rows[0].count)
      }
    };
    client.release();
    console.log('✅ Database: Connected and operational');
    console.log(`   📊 Users: ${services.database.details.users}, Leads: ${services.database.details.leads}`);
  } catch (error) {
    services.database = {
      status: 'error',
      message: `Database connection failed: ${error.message}`,
      details: { error: error.code || 'UNKNOWN' }
    };
    console.log('❌ Database: Connection failed');
    console.log(`   🔴 Error: ${error.message}`);
  }

  // 2. Filesystem validation
  try {
    const staticPath = join(__dirname, 'dist');
    const indexPath = join(staticPath, 'index.html');

    if (process.env.NODE_ENV === 'production') {
      const indexExists = fs.existsSync(indexPath);
      const assetsPath = join(staticPath, 'assets');
      const assetsExists = fs.existsSync(assetsPath);

      if (indexExists && assetsExists) {
        const stats = fs.statSync(indexPath);
        const assetFiles = fs.readdirSync(assetsPath).length;

        services.filesystem = {
          status: 'healthy',
          message: 'Frontend build files found',
          details: {
            indexSize: Math.round(stats.size / 1024) + 'KB',
            assetFiles: assetFiles,
            buildPath: staticPath
          }
        };
        console.log('✅ Filesystem: Frontend build files ready');
        console.log(`   📁 Assets: ${assetFiles} files, Index: ${services.filesystem.details.indexSize}`);
      } else {
        services.filesystem = {
          status: 'warning',
          message: 'Frontend build files missing',
          details: { indexExists, assetsExists, path: staticPath }
        };
        console.log('⚠️  Filesystem: Frontend build files missing');
      }
    } else {
      services.filesystem = {
        status: 'healthy',
        message: 'Development mode - build files not required',
        details: { mode: 'development' }
      };
      console.log('✅ Filesystem: Development mode');
    }
  } catch (error) {
    services.filesystem = {
      status: 'error',
      message: `Filesystem check failed: ${error.message}`,
      details: { error: error.code }
    };
    console.log('❌ Filesystem: Check failed');
  }

  // 3. Environment validation
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
  const optionalEnvVars = ['FRONTEND_URL', 'BACKEND_URL'];
  const missingRequired = requiredEnvVars.filter(key => !process.env[key]);
  const missingOptional = optionalEnvVars.filter(key => !process.env[key]);

  if (missingRequired.length === 0) {
    services.environment = {
      status: 'healthy',
      message: 'All required environment variables set',
      details: {
        required: requiredEnvVars.length,
        optional: optionalEnvVars.length - missingOptional.length,
        missing: missingOptional
      }
    };
    console.log('✅ Environment: All required variables set');
    if (missingOptional.length > 0) {
      console.log(`   ⚠️  Optional missing: ${missingOptional.join(', ')}`);
    }
  } else {
    services.environment = {
      status: 'error',
      message: `Missing required environment variables: ${missingRequired.join(', ')}`,
      details: { missing: missingRequired }
    };
    console.log('❌ Environment: Missing required variables');
    console.log(`   🔴 Missing: ${missingRequired.join(', ')}`);
  }

  // 4. API validation
  try {
    // Test basic API functionality
    const testRoutes = ['/api/health', '/api/auth/me/test'];
    services.api = {
      status: 'healthy',
      message: 'API routes configured',
      details: {
        routes: testRoutes.length,
        middleware: ['cors', 'json', 'static'],
        port: PORT
      }
    };
    console.log('✅ API: Routes and middleware configured');
    console.log(`   🌐 Port: ${PORT}, Routes: ${testRoutes.length}`);
  } catch (error) {
    services.api = {
      status: 'error',
      message: `API configuration error: ${error.message}`,
      details: { error: error.message }
    };
    console.log('❌ API: Configuration error');
  }

  // 5. Frontend validation (in production)
  if (process.env.NODE_ENV === 'production') {
    if (services.filesystem.status === 'healthy') {
      services.frontend = {
        status: 'healthy',
        message: 'Frontend ready to serve',
        details: {
          mode: 'production',
          serving: 'static files',
          spa: 'enabled'
        }
      };
      console.log('✅ Frontend: Ready to serve static files');
    } else {
      services.frontend = {
        status: 'error',
        message: 'Frontend build files not available',
        details: { issue: 'missing build files' }
      };
      console.log('❌ Frontend: Build files not available');
    }
  } else {
    services.frontend = {
      status: 'info',
      message: 'Development mode - frontend served separately',
      details: { mode: 'development', port: 5173 }
    };
    console.log('ℹ️  Frontend: Development mode (separate server)');
  }

  // Summary
  const healthyServices = Object.values(services).filter(s => s.status === 'healthy').length;
  const totalServices = Object.keys(services).length;
  const hasErrors = Object.values(services).some(s => s.status === 'error');

  console.log('\n📊 ===== SERVICE SUMMARY =====');
  console.log(`✅ Healthy: ${healthyServices}/${totalServices} services`);

  if (hasErrors) {
    console.log('🔴 Status: DEGRADED - Some services have issues');
    const errorServices = Object.entries(services)
      .filter(([_, service]) => service.status === 'error')
      .map(([name, _]) => name);
    console.log(`❌ Failed: ${errorServices.join(', ')}`);
  } else {
    console.log('🟢 Status: HEALTHY - All services operational');
  }

  console.log('================================\n');

  return services;
  // Validate all services on startup
  await validateServices();

};

console.log('🎯 Server is ready to accept connections!');
credentials: true,
  console.error('🔴 Server started with errors - check service validation above');
}));
app.use(express.json());

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app build directory
  app.use(express.static(path.join(__dirname, 'dist')));
}

// PostgreSQL connection
const pool = new Pool({
  // Configuración de conexión con validación de tipos
  ...(process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
  } : {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'crm_system',
    password: String(process.env.DB_PASSWORD || ''),
    port: parseInt(process.env.DB_PORT) || 5432,
  }),
  // Configuración SSL
  ssl: process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true' || process.env.DATABASE_URL?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false,
  // Configuración de pool optimizada
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Aumentado para conexiones en la nube
  acquireTimeoutMillis: 60000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200,
});

// Test database connection with detailed info
const testDatabaseConnection = async () => {
  try {
    console.log('\n🔧 ===== CONNECTION CONFIGURATION =====');
    console.log('Using DATABASE_URL:', !!process.env.DATABASE_URL);
    if (process.env.DATABASE_URL) {
      // Mostrar URL sin contraseña para seguridad
      const urlParts = process.env.DATABASE_URL.split('@');
      const safeUrl = urlParts.length > 1 ?
        urlParts[0].split(':').slice(0, -1).join(':') + ':***@' + urlParts[1] :
        'Invalid URL format';
      console.log('DATABASE_URL (masked):', safeUrl);
    } else {
      console.log('Individual parameters:');
      console.log(`   • Host: ${process.env.DB_HOST || 'localhost'}`);
      console.log(`   • Port: ${process.env.DB_PORT || 5432}`);
      console.log(`   • Database: ${process.env.DB_NAME || 'crm_system'}`);
      console.log(`   • User: ${process.env.DB_USER || 'postgres'}`);
      console.log(`   • Password: ${process.env.DB_PASSWORD ? '***' : 'NOT SET'}`);
    }
    console.log(`SSL Mode: ${process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true' || process.env.DATABASE_URL?.includes('neon.tech') ? 'Enabled' : 'Disabled'}`);
    console.log('==========================================\n');

    const client = await pool.connect();

    // Get database info
    const dbInfo = await client.query(`
      SELECT 
        current_database() as database_name,
        current_user as connected_user,
        inet_server_addr() as server_address,
        inet_server_port() as server_port,
        version() as postgres_version
    `);

    // Check if our tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'leads', 'interactions', 'roles', 'permissions')
      ORDER BY table_name
    `);

    // Count records in main tables
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const leadCount = await client.query('SELECT COUNT(*) FROM leads');
    const roleCount = await client.query('SELECT COUNT(*) FROM roles');

    client.release();

    console.log('\n🐘 ===== POSTGRESQL CONNECTION STATUS =====');
    console.log('✅ Successfully connected to PostgreSQL!');
    console.log('📊 Database Info:');
    console.log(`   • Database: ${dbInfo.rows[0].database_name}`);
    console.log(`   • User: ${dbInfo.rows[0].connected_user}`);
    console.log(`   • Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
    console.log(`   • Version: ${dbInfo.rows[0].postgres_version.split(' ')[0]} ${dbInfo.rows[0].postgres_version.split(' ')[1]}`);

    console.log('\n📋 Tables Status:');
    if (tablesResult.rows.length > 0) {
      console.log('✅ Found tables:', tablesResult.rows.map(r => r.table_name).join(', '));
      console.log('\n📈 Data Summary:');
      console.log(`   • Users: ${userCount.rows[0].count}`);
      console.log(`   • Leads: ${leadCount.rows[0].count}`);
      console.log(`   • Roles: ${roleCount.rows[0].count}`);
    } else {
      console.log('⚠️  No CRM tables found. Run the database-schema.sql script first!');
    }

    console.log('==========================================\n');

  } catch (err) {
    console.log('\n❌ ===== DATABASE CONNECTION ERROR =====');
    console.error('Error:', err.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check your .env file configuration:');
    console.log(`   DB_HOST=${process.env.DB_HOST || 'localhost'}`);
    console.log(`   DB_PORT=${process.env.DB_PORT || 5432}`);
    console.log(`   DB_NAME=${process.env.DB_NAME || 'crm_system'}`);
    console.log(`   DB_USER=${process.env.DB_USER || 'postgres'}`);
    console.log('3. Create database: CREATE DATABASE crm_system;');
    console.log('4. Run schema: psql -U postgres -d crm_system -f database-schema.sql');
    console.log('========================================\n');
  }
};

// Test connection on startup
testDatabaseConnection();

// Generar ID único simple (fallback si uuid no está disponible)
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// RUTAS DE AUTENTICACIÓN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email }); // No logear password

    const result = await pool.query(
      `SELECT 
        u.id, u.email, u.name, u.status,
        r.name as role_name,
        r.display_name as role_display_name,
        ARRAY_AGG(p.name) as permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.email = $1 AND u.password = $2 AND u.status = $3
      GROUP BY u.id, u.email, u.name, u.status, r.name, r.display_name
    `,
      [email, password, 'ACTIVE']
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    // Actualizar último login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role_name || 'viewer',
        roleDisplayName: user.role_display_name || 'Visualizador',
        permissions: user.permissions || []
      },
      token: 'simple-token-' + user.id
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error en login' });
  }
});

app.get('/api/auth/me/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validar token del header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticación requerido' });
    }

    const token = authHeader.split(' ')[1];
    const tokenUserId = token.replace('simple-token-', '');

    // Verificar que el token corresponde al usuario solicitado
    if (tokenUserId !== userId) {
      return res.status(401).json({ error: 'Token no válido para este usuario' });
    }

    const result = await pool.query(`
      SELECT 
        u.id, u.email, u.name, u.status,
        r.name as role_name,
        r.display_name as role_display_name,
        ARRAY_AGG(p.name) as permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = $1 AND u.status = $2
      GROUP BY u.id, u.email, u.name, u.status, r.name, r.display_name
    `,
      [userId, 'ACTIVE']
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];

      // Actualizar último login
      await pool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role_name || 'viewer',
          roleDisplayName: user.role_display_name || 'Visualizador',
          permissions: user.permissions || []
        }
      });
    } else {
      res.status(401).json({ error: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ error: 'Error de autenticación' });
  }
});

// RUTAS DE LEADS
app.get('/api/leads', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, responsibleId } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        l.*,
        u.name as responsible_name,
        u.email as responsible_email,
        COUNT(i.id) as interaction_count
      FROM leads l
      LEFT JOIN users u ON l.responsible_id = u.id
      LEFT JOIN interactions i ON l.id = i.lead_id
    `;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (status) {
      whereConditions.push(`l.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (responsibleId) {
      whereConditions.push(`l.responsible_id = $${paramIndex}`);
      queryParams.push(responsibleId);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(l.name ILIKE $${paramIndex} OR l.email ILIKE $${paramIndex} OR l.company ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    query += ` 
      GROUP BY l.id, u.name, u.email
      ORDER BY l.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), offset);

    const result = await pool.query(query, queryParams);

    // Obtener tags para cada lead
    const leadsWithTags = await Promise.all(result.rows.map(async (lead) => {
      const tagsResult = await pool.query(`
        SELECT t.name 
        FROM tags t
        JOIN lead_tags lt ON t.id = lt.tag_id
        WHERE lt.lead_id = $1
      `, [lead.id]);

      return {
        ...lead,
        tags: tagsResult.rows.map(row => row.name),
        responsible: lead.responsible_name ? {
          id: lead.responsible_id,
          name: lead.responsible_name,
          email: lead.responsible_email
        } : null,
        _count: {
          interactions: parseInt(lead.interaction_count) || 0
        }
      };
    }));

    // Contar total para paginación
    let countQuery = 'SELECT COUNT(*) FROM leads l';
    let countParams = [];
    let countParamIndex = 1;

    if (whereConditions.length > 0) {
      countQuery += ' WHERE ' + whereConditions.join(' AND ').replace(/\$\d+/g, () => `$${countParamIndex++}`);
      // Ajustar parámetros para la consulta de conteo
      if (status) {
        countParams.push(status);
      }
      if (responsibleId) {
        countParams.push(responsibleId);
      }
      if (search) {
        countParams.push(`%${search}%`);
      }
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      leads: leadsWithTags,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting leads:', error);
    res.status(500).json({ error: 'Error obteniendo leads' });
  }
});

app.get('/api/leads/priority/list', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        l.*,
        u.name as responsible_name,
        u.email as responsible_email,
        COUNT(i.id) as interaction_count,
        CASE 
          WHEN l.status = 'NEW' THEN 100
          WHEN l.status = 'CONTACTED' THEN 80
          WHEN l.status = 'QUALIFIED' THEN 120
          WHEN l.status = 'PROPOSAL' THEN 150
          WHEN l.status = 'NEGOTIATION' THEN 200
          ELSE 50
        END +
        COALESCE(LEAST(l.potential_value / 100, 100), 0) +
        CASE 
          WHEN l.last_interaction_date IS NULL THEN 75
          WHEN l.last_interaction_date < CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 50
          ELSE 0
        END as priority_score
      FROM leads l
      LEFT JOIN users u ON l.responsible_id = u.id
      LEFT JOIN interactions i ON l.id = i.lead_id
      GROUP BY l.id, u.name, u.email
      ORDER BY priority_score DESC
    `);

    // Obtener tags para cada lead
    const leadsWithTags = await Promise.all(result.rows.map(async (lead) => {
      const tagsResult = await pool.query(`
        SELECT t.name 
        FROM tags t
        JOIN lead_tags lt ON t.id = lt.tag_id
        WHERE lt.lead_id = $1
      `, [lead.id]);

      return {
        ...lead,
        priorityScore: Math.round(lead.priority_score),
        tags: tagsResult.rows.map(row => row.name),
        responsible: lead.responsible_name ? {
          id: lead.responsible_id,
          name: lead.responsible_name,
          email: lead.responsible_email
        } : null,
        _count: {
          interactions: parseInt(lead.interaction_count) || 0
        }
      };
    }));

    res.json({ leads: leadsWithTags });
  } catch (error) {
    console.error('Error getting priority leads:', error);
    res.status(500).json({ error: 'Error obteniendo leads prioritarios' });
  }
});

app.get('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const leadResult = await pool.query(`
      SELECT 
        l.*,
        u.name as responsible_name,
        u.email as responsible_email
      FROM leads l
      LEFT JOIN users u ON l.responsible_id = u.id
      WHERE l.id = $1
    `, [id]);

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    const lead = leadResult.rows[0];

    // Obtener tags
    const tagsResult = await pool.query(`
      SELECT t.id, t.name, t.color
      FROM tags t
      JOIN lead_tags lt ON t.id = lt.tag_id
      WHERE lt.lead_id = $1
    `, [id]);

    // Obtener interacciones
    const interactionsResult = await pool.query(`
      SELECT 
        i.*,
        u.name as user_name
      FROM interactions i
      JOIN users u ON i.user_id = u.id
      WHERE i.lead_id = $1
      ORDER BY i.created_at DESC
    `, [id]);

    const leadWithDetails = {
      ...lead,
      responsible: lead.responsible_name ? {
        id: lead.responsible_id,
        name: lead.responsible_name,
        email: lead.responsible_email
      } : null,
      tags: tagsResult.rows.map(tag => ({
        tag: {
          id: tag.id,
          name: tag.name,
          color: tag.color
        }
      })),
      interactions: interactionsResult.rows.map(interaction => ({
        ...interaction,
        user: {
          id: interaction.user_id,
          name: interaction.user_name
        }
      }))
    };

    res.json({ lead: leadWithDetails });
  } catch (error) {
    console.error('Error getting lead:', error);
    res.status(500).json({ error: 'Error obteniendo lead' });
  }
});

app.post('/api/leads', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      name, email, phone, company, position, source = 'OTHER',
      segment, potentialValue, notes, responsibleId, tags = []
    } = req.body;

    // Insertar lead
    const leadResult = await client.query(`
      INSERT INTO leads (name, email, phone, company, position, status, source, segment, potential_value, notes, responsible_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [name, email, phone, company, position, 'NEW', source, segment, potentialValue, notes, responsibleId || null]);

    const newLead = leadResult.rows[0];

    // Insertar tags si existen
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        if (tagName.trim()) {
          // Insertar o obtener tag
          const tagResult = await client.query(`
            INSERT INTO tags (name) VALUES ($1)
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
          `, [tagName.trim()]);

          const tagId = tagResult.rows[0].id;

          // Asociar tag con lead
          await client.query(`
            INSERT INTO lead_tags (lead_id, tag_id) VALUES ($1, $2)
            ON CONFLICT (lead_id, tag_id) DO NOTHING
          `, [newLead.id, tagId]);
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ lead: newLead });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Error creando lead' });
  } finally {
    client.release();
  }
});

// RUTAS DE INTERACCIONES
app.post('/api/interactions', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      leadId, type, channel, phoneUsed, result, duration, notes, scheduledAt, completedAt
    } = req.body;

    console.log('Creating interaction with data:', req.body); // Debug log

    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID es requerido' });
    }

    // Obtener el userId del token de autenticación
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticación requerido' });
    }

    const token = authHeader.split(' ')[1];
    // Extraer el userId del token simple (formato: simple-token-{userId})
    const userId = token.replace('simple-token-', '');

    if (!userId) {
      return res.status(401).json({ error: 'Token de autenticación inválido' });
    }

    // Verificar que el usuario existe y está activo
    const userCheck = await client.query('SELECT id, name FROM users WHERE id = $1 AND status = $2', [userId, 'ACTIVE']);
    if (userCheck.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }

    // Verificar que el lead existe
    const leadCheck = await client.query('SELECT id FROM leads WHERE id = $1', [leadId]);
    if (leadCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Lead no encontrado' });
    }

    console.log('Creating interaction for user:', userCheck.rows[0].name, 'with ID:', userId); // Debug log

    const interactionResult = await client.query(`
      INSERT INTO interactions (lead_id, user_id, type, channel, phone_used, result, duration, notes, scheduled_at, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      leadId,
      userId,
      type,
      channel,
      phoneUsed || null,
      result,
      duration ? parseInt(duration) : null,
      notes || null,
      scheduledAt || null,
      completedAt || new Date().toISOString()
    ]);

    // Actualizar fecha de última interacción del lead
    await client.query(`
      UPDATE leads 
      SET last_interaction_date = CURRENT_TIMESTAMP 
      WHERE id = $1
    `, [leadId]);

    await client.query('COMMIT');

    const newInteraction = interactionResult.rows[0];

    console.log('Interaction created successfully:', newInteraction.id); // Debug log

    res.status(201).json({
      interaction: {
        ...newInteraction,
        user: {
          id: userId,
          name: userCheck.rows[0].name
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating interaction:', error);
    res.status(500).json({ error: 'Error creando interacción: ' + error.message });
  } finally {
    client.release();
  }
});

// Actualizar interacción
app.put('/api/interactions/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      type, channel, phoneUsed, result, duration, notes, scheduledAt, completedAt
    } = req.body;

    // Obtener el userId del token de autenticación para logs
    const authHeader = req.headers.authorization;
    let currentUserId = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      currentUserId = token.replace('simple-token-', '');
    }

    console.log('Updating interaction:', id, 'by user:', currentUserId); // Debug log

    const interactionResult = await client.query(`
      UPDATE interactions 
      SET type = $1, channel = $2, phone_used = $3, result = $4, 
          duration = $5, notes = $6, scheduled_at = $7, completed_at = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `, [type, channel, phoneUsed, result, duration, notes, scheduledAt, completedAt, id]);

    if (interactionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Interacción no encontrada' });
    }

    await client.query('COMMIT');

    const updatedInteraction = interactionResult.rows[0];
    const userInfo = await pool.query('SELECT name FROM users WHERE id = $1', [updatedInteraction.user_id]);

    res.json({
      interaction: {
        ...updatedInteraction,
        user: {
          id: updatedInteraction.user_id,
          name: userInfo.rows[0]?.name || 'Usuario'
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating interaction:', error);
    res.status(500).json({ error: 'Error actualizando interacción' });
  } finally {
    client.release();
  }
});

// Eliminar interacción
app.delete('/api/interactions/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Verificar que la interacción existe
    const interactionCheck = await client.query('SELECT id, lead_id FROM interactions WHERE id = $1', [id]);
    if (interactionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Interacción no encontrada' });
    }

    // Eliminar interacción
    await client.query('DELETE FROM interactions WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Interacción eliminada correctamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting interaction:', error);
    res.status(500).json({ error: 'Error eliminando interacción' });
  } finally {
    client.release();
  }
});

// Obtener todas las interacciones
app.get('/api/interactions', async (req, res) => {
  try {
    const { page = 1, limit = 50, leadId, userId } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        i.*,
        l.name as lead_name,
        l.company as lead_company,
        l.responsible_id as lead_responsible_id,
        u.name as user_name
      FROM interactions i
      JOIN leads l ON i.lead_id = l.id
      JOIN users u ON i.user_id = u.id
    `;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (leadId) {
      whereConditions.push(`i.lead_id = $${paramIndex}`);
      queryParams.push(leadId);
      paramIndex++;
    }

    if (userId) {
      whereConditions.push(`i.user_id = $${paramIndex}`);
      queryParams.push(userId);
      paramIndex++;
    }

    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    query += ` 
      ORDER BY i.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), offset);

    const result = await pool.query(query, queryParams);

    const interactions = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      channel: row.channel,
      phoneUsed: row.phone_used,
      result: row.result,
      duration: row.duration,
      notes: row.notes,
      scheduledAt: row.scheduled_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        name: row.user_name
      },
      lead: {
        id: row.lead_id,
        name: row.lead_name,
        company: row.lead_company,
        responsible_id: row.lead_responsible_id
      }
    }));

    // Contar total para paginación
    let countQuery = 'SELECT COUNT(*) FROM interactions i JOIN leads l ON i.lead_id = l.id';
    let countParams = [];
    let countParamIndex = 1;

    if (whereConditions.length > 0) {
      countQuery += ' WHERE ' + whereConditions.join(' AND ').replace(/\$\d+/g, () => `$${countParamIndex++}`);
      if (leadId) {
        countParams.push(leadId);
      }
      if (userId) {
        countParams.push(userId);
      }
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      interactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting interactions:', error);
    res.status(500).json({ error: 'Error obteniendo interacciones' });
  }
});
// RUTAS DE USUARIOS
app.get('/api/users', async (req, res) => {
  try {
    console.log('GET /api/users - Request received');

    const result = await pool.query(`
      SELECT 
        u.id, u.email, u.name, u.phone, u.status, u.last_login, u.created_at,
        r.name as role_name,
        r.display_name as role_display_name,
        up.department,
        up.position,
        up.bio,
        COUNT(DISTINCT l.id) as leads_assigned,
        COUNT(DISTINCT i.id) as interactions_count
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN leads l ON u.id = l.responsible_id
      LEFT JOIN interactions i ON u.id = i.user_id
      GROUP BY u.id, u.email, u.name, u.phone, u.status, u.last_login, u.created_at, 
               r.name, r.display_name, up.department, up.position, up.bio
      ORDER BY u.created_at DESC
    `);

    const users = result.rows.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role_name || 'viewer',
      roleDisplayName: user.role_display_name || 'Visualizador',
      department: user.department,
      position: user.position,
      bio: user.bio,
      status: user.status,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      _count: {
        leadsAssigned: parseInt(user.leads_assigned) || 0,
        interactions: parseInt(user.interactions_count) || 0
      }
    }));

    console.log('Processed users:', users.length);
    res.json({ users });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
});

// RUTAS DE USUARIOS - CRUD COMPLETO
app.post('/api/users', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      name, email, phone, password, roleId, status = 'ACTIVE',
      department, position, bio
    } = req.body;

    // Verificar si el email ya existe
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está en uso' });
    }

    // Insertar usuario
    const userResult = await client.query(`
      INSERT INTO users (name, email, phone, password, role_id, status, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, email, phone, password, roleId, status, true]);

    const newUser = userResult.rows[0];

    // Insertar perfil si se proporcionó información adicional
    if (department || position || bio) {
      await client.query(`
        INSERT INTO user_profiles (user_id, department, position, bio)
        VALUES ($1, $2, $3, $4)
      `, [newUser.id, department, position, bio]);
    }

    await client.query('COMMIT');
    res.status(201).json({ user: newUser });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error creando usuario' });
  } finally {
    client.release();
  }
});

app.put('/api/users/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      name, email, phone, password, roleId, status,
      department, position, bio
    } = req.body;

    // Verificar si el email ya existe (excluyendo el usuario actual)
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, id]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está en uso' });
    }

    // Actualizar usuario
    let updateQuery = `
      UPDATE users 
      SET name = $1, email = $2, phone = $3, role_id = $4, status = $5, updated_at = CURRENT_TIMESTAMP
    `;
    let queryParams = [name, email, phone, roleId, status];

    // Si se proporcionó nueva contraseña, incluirla
    if (password) {
      updateQuery += `, password = $6, password_changed_at = CURRENT_TIMESTAMP WHERE id = $7`;
      queryParams.push(password, id);
    } else {
      updateQuery += ` WHERE id = $6`;
      queryParams.push(id);
    }

    updateQuery += ' RETURNING *';

    const userResult = await client.query(updateQuery, queryParams);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Actualizar o insertar perfil
    await client.query(`
      INSERT INTO user_profiles (user_id, department, position, bio)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        department = EXCLUDED.department,
        position = EXCLUDED.position,
        bio = EXCLUDED.bio,
        updated_at = CURRENT_TIMESTAMP
    `, [id, department, position, bio]);

    await client.query('COMMIT');
    res.json({ user: userResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Error actualizando usuario' });
  } finally {
    client.release();
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Verificar que el usuario existe
    const userCheck = await client.query('SELECT id, email FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No permitir eliminar el usuario admin principal
    if (userCheck.rows[0].email === 'admin@crm.com') {
      return res.status(400).json({ error: 'No se puede eliminar el usuario administrador principal' });
    }

    // Eliminar usuario (las relaciones se manejan con ON DELETE CASCADE/SET NULL)
    await client.query('DELETE FROM users WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error eliminando usuario' });
  } finally {
    client.release();
  }
});

// RUTAS DE LEADS - ACTUALIZAR Y ELIMINAR
app.put('/api/leads/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      name, email, phone, company, position, source, segment,
      potentialValue, notes, responsibleId, tags = [], status
    } = req.body;

    // Actualizar lead
    const leadResult = await client.query(`
      UPDATE leads 
      SET name = $1, email = $2, phone = $3, company = $4, position = $5, 
          source = $6, segment = $7, potential_value = $8, notes = $9, 
          responsible_id = $10, status = $11, updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `, [name, email, phone, company, position, source, segment,
      potentialValue, notes, responsibleId || null, status || 'NEW', id]);

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    // Eliminar tags existentes
    await client.query('DELETE FROM lead_tags WHERE lead_id = $1', [id]);

    // Insertar nuevos tags si existen
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        if (tagName.trim()) {
          // Insertar o obtener tag
          const tagResult = await client.query(`
            INSERT INTO tags (name) VALUES ($1)
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
          `, [tagName.trim()]);

          const tagId = tagResult.rows[0].id;

          // Asociar tag con lead
          await client.query(`
            INSERT INTO lead_tags (lead_id, tag_id) VALUES ($1, $2)
          `, [id, tagId]);
        }
      }
    }

    await client.query('COMMIT');
    res.json({ lead: leadResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Error actualizando lead' });
  } finally {
    client.release();
  }
});

app.delete('/api/leads/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Verificar que el lead existe
    const leadCheck = await client.query('SELECT id, name FROM leads WHERE id = $1', [id]);
    if (leadCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    // Eliminar lead (las relaciones se manejan con ON DELETE CASCADE)
    await client.query('DELETE FROM leads WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Lead eliminado correctamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Error eliminando lead' });
  } finally {
    client.release();
  }
});

// RUTAS DE ROLES Y PERMISOS
app.get('/api/roles', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.*,
        COUNT(u.id) as user_count,
        ARRAY_AGG(
          CASE WHEN p.name IS NOT NULL 
          THEN json_build_object(
            'name', p.name,
            'display_name', p.display_name,
            'module', p.module,
            'action', p.action
          ) END
        ) FILTER (WHERE p.name IS NOT NULL) as permissions
      FROM roles r
      LEFT JOIN users u ON r.id = u.role_id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE r.is_active = true
      GROUP BY r.id, r.name, r.display_name, r.description, r.is_active, r.created_at, r.updated_at
      ORDER BY r.created_at
    `);

    res.json({ roles: result.rows });
  } catch (error) {
    console.error('Error getting roles:', error);
    res.status(500).json({ error: 'Error obteniendo roles' });
  }
});

app.post('/api/roles', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { name, display_name, description, is_active = true, permissions = [] } = req.body;

    // Verificar si el rol ya existe
    const existingRole = await client.query('SELECT id FROM roles WHERE name = $1', [name]);
    if (existingRole.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe un rol con ese nombre' });
    }

    // Crear el rol
    const roleResult = await client.query(`
      INSERT INTO roles (name, display_name, description, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, display_name, description, is_active]);

    const newRole = roleResult.rows[0];

    // Asignar permisos si se proporcionaron
    if (permissions.length > 0) {
      for (const permissionName of permissions) {
        const permissionResult = await client.query(
          'SELECT id FROM permissions WHERE name = $1',
          [permissionName]
        );

        if (permissionResult.rows.length > 0) {
          await client.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES ($1, $2)
          `, [newRole.id, permissionResult.rows[0].id]);
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ role: newRole });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Error creando rol' });
  } finally {
    client.release();
  }
});

app.put('/api/roles/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { name, display_name, description, is_active, permissions = [] } = req.body;

    // Verificar si el rol existe
    const roleCheck = await client.query('SELECT name FROM roles WHERE id = $1', [id]);
    if (roleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    // No permitir cambiar el nombre de roles del sistema
    const systemRoles = ['super_admin', 'admin'];
    if (systemRoles.includes(roleCheck.rows[0].name) && name !== roleCheck.rows[0].name) {
      return res.status(400).json({ error: 'No se puede cambiar el nombre de roles del sistema' });
    }

    // Actualizar el rol
    const roleResult = await client.query(`
      UPDATE roles 
      SET display_name = $1, description = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [display_name, description, is_active, id]);

    // Eliminar permisos existentes
    await client.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);

    // Asignar nuevos permisos
    if (permissions.length > 0) {
      for (const permissionName of permissions) {
        const permissionResult = await client.query(
          'SELECT id FROM permissions WHERE name = $1',
          [permissionName]
        );

        if (permissionResult.rows.length > 0) {
          await client.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES ($1, $2)
          `, [id, permissionResult.rows[0].id]);
        }
      }
    }

    await client.query('COMMIT');
    res.json({ role: roleResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Error actualizando rol' });
  } finally {
    client.release();
  }
});

app.delete('/api/roles/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Verificar que el rol existe
    const roleCheck = await client.query('SELECT name FROM roles WHERE id = $1', [id]);
    if (roleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    // No permitir eliminar roles del sistema
    const systemRoles = ['super_admin', 'admin'];
    if (systemRoles.includes(roleCheck.rows[0].name)) {
      return res.status(400).json({ error: 'No se puede eliminar un rol del sistema' });
    }

    // Verificar que no hay usuarios asignados
    const userCount = await client.query('SELECT COUNT(*) FROM users WHERE role_id = $1', [id]);
    if (parseInt(userCount.rows[0].count) > 0) {
      return res.status(400).json({ error: 'No se puede eliminar un rol que tiene usuarios asignados' });
    }

    // Eliminar rol
    await client.query('DELETE FROM roles WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Rol eliminado correctamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Error eliminando rol' });
  } finally {
    client.release();
  }
});

app.get('/api/permissions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM permissions 
      ORDER BY module, action, name
    `);

    // Group permissions by module
    const permissionsByModule = result.rows.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {});

    res.json({
      permissions: result.rows,
      permissionsByModule
    });
  } catch (error) {
    console.error('Error getting permissions:', error);
    res.status(500).json({ error: 'Error obteniendo permisos' });
  }
});

// Ruta para obtener permisos de un usuario específico
app.get('/api/users/:id/permissions', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        p.name,
        p.display_name,
        p.module,
        p.action,
        p.description
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = $1 AND u.status = 'ACTIVE' AND r.is_active = true
      ORDER BY p.module, p.action
    `, [id]);

    res.json({ permissions: result.rows });
  } catch (error) {
    console.error('Error getting user permissions:', error);
    res.status(500).json({ error: 'Error obteniendo permisos del usuario' });
  }
});

// RUTAS DE ANALYTICS
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = parseInt(period);

    // Estadísticas generales
    const totalLeadsResult = await pool.query('SELECT COUNT(*) FROM leads');
    const totalLeads = parseInt(totalLeadsResult.rows[0].count);

    const newLeadsResult = await pool.query(
      'SELECT COUNT(*) FROM leads WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL \'' + daysAgo + ' days\''
    );
    const newLeads = parseInt(newLeadsResult.rows[0].count);

    const totalInteractionsResult = await pool.query(
      'SELECT COUNT(*) FROM interactions WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL \'' + daysAgo + ' days\''
    );
    const totalInteractions = parseInt(totalInteractionsResult.rows[0].count);

    const leadsConvertedResult = await pool.query('SELECT COUNT(*) FROM leads WHERE status = $1', ['CLOSED_WON']);
    const leadsConverted = parseInt(leadsConvertedResult.rows[0].count);

    // Leads por estado
    const leadsByStatusResult = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM leads 
      GROUP BY status 
      ORDER BY count DESC
    `);

    // Interacciones por tipo
    const interactionsByTypeResult = await pool.query(`
      SELECT type, COUNT(*) as count 
      FROM interactions 
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${daysAgo} days'
      GROUP BY type 
      ORDER BY count DESC
    `);

    // Top performers
    const topPerformersResult = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        COUNT(i.id) as interaction_count
      FROM users u
      LEFT JOIN interactions i ON u.id = i.user_id AND i.created_at >= CURRENT_TIMESTAMP - INTERVAL '${daysAgo} days'
      GROUP BY u.id, u.name
      ORDER BY interaction_count DESC
      LIMIT 5
    `);

    // Actividad reciente
    const recentActivityResult = await pool.query(`
      SELECT 
        i.id,
        'INTERACTION_CREATED' as action,
        'Interaction' as entity_type,
        u.name as user_name,
        l.name as lead_name,
        i.created_at
      FROM interactions i
      JOIN users u ON i.user_id = u.id
      JOIN leads l ON i.lead_id = l.id
      ORDER BY i.created_at DESC
      LIMIT 10
    `);

    res.json({
      summary: {
        totalLeads,
        newLeads,
        totalInteractions,
        leadsConverted,
        conversionRate: totalLeads > 0 ? Math.round((leadsConverted / totalLeads) * 100) : 0
      },
      leadsByStatus: leadsByStatusResult.rows,
      interactionsByType: interactionsByTypeResult.rows,
      topPerformers: topPerformersResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        interactionCount: parseInt(row.interaction_count) || 0
      })),
      recentActivity: recentActivityResult.rows
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Error obteniendo analytics' });
  }
});

// RUTAS DE CONFIGURACIÓN
app.get('/api/settings', async (req, res) => {
  try {
    const tagsResult = await pool.query('SELECT name FROM tags ORDER BY name');

    res.json({
      settings: {
        availableTags: tagsResult.rows.map(row => row.name)
      }
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Error obteniendo configuración' });
  }
});

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API funcionando correctamente con PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.connect();

    // Get detailed database info
    const dbInfo = await client.query(`
      SELECT 
        current_database() as database_name,
        current_user as connected_user,
        version() as postgres_version
    `);

    // Check tables
    const tablesResult = await client.query(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'leads', 'interactions', 'roles', 'permissions')
    `);

    // Get record counts
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const leadCount = await client.query('SELECT COUNT(*) FROM leads');

    client.release();

    res.json({
      status: 'OK',
      database: {
        status: 'Connected',
        name: dbInfo.rows[0].database_name,
        user: dbInfo.rows[0].connected_user,
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        version: dbInfo.rows[0].postgres_version.split(' ')[1],
        tables_found: parseInt(tablesResult.rows[0].table_count),
        records: {
          users: parseInt(userCount.rows[0].count),
          leads: parseInt(leadCount.rows[0].count)
    const services = await validateServices();

          const healthyServices = Object.values(services).filter(s => s.status === 'healthy').length;
          const totalServices = Object.keys(services).length;
          const hasErrors = Object.values(services).some(s => s.status === 'error');
        } catch(error) {
          res.status(500).json({
            status: hasErrors ? 'degraded' : 'healthy',
            timestamp: new Date().toISOString(),
            services: services,
            summary: {
              healthy: healthyServices,
              total: totalServices,
              percentage: Math.round((healthyServices / totalServices) * 100)
            }
        port: process.env.DB_PORT || 5432,
            name: process.env.DB_NAME || 'crm_system'
          },
            error: error.message,
            timestamp: new Date().toISOString(),
            error: error.message,
            services: {
            database: { status: 'error', message: error.message }
          }
    });
  }
});

// Serve React app for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    // Don't serve React app for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }

    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor CRM ejecutándose en http://localhost:${PORT}`);
  console.log(`📊 API disponible en: http://localhost:${PORT}/api`);
  console.log(`🔑 Credenciales: admin@crm.com / admin123`);
  console.log(`🐘 Conectando a PostgreSQL...`);
});