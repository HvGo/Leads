import { verifyToken, extractTokenFromHeader } from '../utils/auth.js';
import pkg from 'pg';
const { Pool } = pkg;

// Usar la misma configuración de pool que en server.js
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
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const authenticateToken = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acceso requerido',
        code: 'MISSING_TOKEN'
      });
    }

    const decoded = verifyToken(token);
    
    // Verificar que el usuario existe y está activo
    const userResult = await pool.query(`
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
    `, [decoded.userId, 'ACTIVE']);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Usuario no encontrado o inactivo',
        code: 'INVALID_USER'
      });
    }

    const user = userResult.rows[0];
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role_name || 'viewer',
      roleDisplayName: user.role_display_name || 'Visualizador',
      permissions: user.permissions || []
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        code: 'EXPIRED_TOKEN'
      });
    }

    console.error('Error en autenticación:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Super admin tiene todos los permisos
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Verificar si tiene el permiso específico
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Permisos insuficientes',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permission
      });
    }

    next();
  };
};

export const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Rol insuficiente',
        code: 'INSUFFICIENT_ROLE',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

export const canAccessLead = async (req, res, next) => {
  try {
    const leadId = req.params.id;
    
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Super admin, admin y manager pueden acceder a todos los leads
    if (['super_admin', 'admin', 'manager'].includes(req.user.role)) {
      return next();
    }

    // Sales rep solo puede acceder a sus leads asignados
    if (req.user.role === 'sales_rep') {
      const leadResult = await pool.query(
        'SELECT responsible_id FROM leads WHERE id = $1',
        [leadId]
      );

      if (leadResult.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Lead no encontrado',
          code: 'LEAD_NOT_FOUND'
        });
      }

      const lead = leadResult.rows[0];
      if (lead.responsible_id !== req.user.id) {
        return res.status(403).json({ 
          error: 'No tienes acceso a este lead',
          code: 'LEAD_ACCESS_DENIED'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error verificando acceso a lead:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};
