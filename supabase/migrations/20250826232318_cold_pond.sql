-- CRM System Database Schema for PostgreSQL with Roles and Profiles
-- Execute this script in your local PostgreSQL database

-- Create database (run this separately as superuser)
-- CREATE DATABASE crm_system;
-- \c crm_system;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL, -- leads, users, analytics, etc.
    action VARCHAR(50) NOT NULL, -- create, read, update, delete, manage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Role permissions relationship table
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- User profiles table (extended user information)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avatar_url VARCHAR(500),
    bio TEXT,
    department VARCHAR(100),
    position VARCHAR(100),
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    hire_date DATE,
    birth_date DATE,
    address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Users table (modified to include role)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table (for better session management)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leads table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    position VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'NEW',
    source VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    segment VARCHAR(100),
    potential_value DECIMAL(12,2),
    notes TEXT,
    responsible_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    last_interaction_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lead tags relationship table
CREATE TABLE lead_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lead_id, tag_id)
);

-- Interactions table
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    phone_used VARCHAR(50),
    result VARCHAR(50) NOT NULL,
    duration INTEGER, -- in minutes
    notes TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activity log table (for audit trail)
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- lead, user, interaction, etc.
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_manager_id ON user_profiles(manager_id);
CREATE INDEX idx_user_profiles_department ON user_profiles(department);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_is_active ON roles(is_active);

CREATE INDEX idx_permissions_module ON permissions(module);
CREATE INDEX idx_permissions_action ON permissions(action);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_responsible_id ON leads(responsible_id);
CREATE INDEX idx_leads_created_by ON leads(created_by);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_last_interaction_date ON leads(last_interaction_date);

CREATE INDEX idx_interactions_lead_id ON interactions(lead_id);
CREATE INDEX idx_interactions_user_id ON interactions(user_id);
CREATE INDEX idx_interactions_type ON interactions(type);
CREATE INDEX idx_interactions_created_at ON interactions(created_at);

CREATE INDEX idx_lead_tags_lead_id ON lead_tags(lead_id);
CREATE INDEX idx_lead_tags_tag_id ON lead_tags(tag_id);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON interactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default roles
INSERT INTO roles (name, display_name, description) VALUES 
('super_admin', 'Super Administrador', 'Acceso completo al sistema, puede gestionar todo'),
('admin', 'Administrador', 'Puede gestionar usuarios, leads y configuraciones'),
('manager', 'Gerente', 'Puede gestionar leads y ver reportes de su equipo'),
('sales_rep', 'Representante de Ventas', 'Puede gestionar sus leads asignados'),
('viewer', 'Visualizador', 'Solo puede ver información, sin permisos de edición');

-- Insert permissions
INSERT INTO permissions (name, display_name, description, module, action) VALUES 
-- User management permissions
('users.create', 'Crear Usuarios', 'Puede crear nuevos usuarios', 'users', 'create'),
('users.read', 'Ver Usuarios', 'Puede ver la lista de usuarios', 'users', 'read'),
('users.update', 'Editar Usuarios', 'Puede editar información de usuarios', 'users', 'update'),
('users.delete', 'Eliminar Usuarios', 'Puede eliminar usuarios', 'users', 'delete'),
('users.manage_roles', 'Gestionar Roles', 'Puede asignar y cambiar roles', 'users', 'manage'),

-- Lead management permissions
('leads.create', 'Crear Leads', 'Puede crear nuevos leads', 'leads', 'create'),
('leads.read', 'Ver Leads', 'Puede ver la lista de leads', 'leads', 'read'),
('leads.update', 'Editar Leads', 'Puede editar información de leads', 'leads', 'update'),
('leads.delete', 'Eliminar Leads', 'Puede eliminar leads', 'leads', 'delete'),
('leads.assign', 'Asignar Leads', 'Puede asignar leads a otros usuarios', 'leads', 'assign'),
('leads.view_all', 'Ver Todos los Leads', 'Puede ver leads de todos los usuarios', 'leads', 'view_all'),

-- Interaction permissions
('interactions.create', 'Crear Interacciones', 'Puede registrar nuevas interacciones', 'interactions', 'create'),
('interactions.read', 'Ver Interacciones', 'Puede ver el historial de interacciones', 'interactions', 'read'),
('interactions.update', 'Editar Interacciones', 'Puede editar interacciones existentes', 'interactions', 'update'),
('interactions.delete', 'Eliminar Interacciones', 'Puede eliminar interacciones', 'interactions', 'delete'),

-- Analytics permissions
('analytics.read', 'Ver Análisis', 'Puede ver dashboards y reportes', 'analytics', 'read'),
('analytics.export', 'Exportar Datos', 'Puede exportar reportes y datos', 'analytics', 'export'),
('analytics.advanced', 'Análisis Avanzado', 'Puede ver métricas avanzadas y comparativas', 'analytics', 'advanced'),

-- System permissions
('system.settings', 'Configuración del Sistema', 'Puede modificar configuraciones generales', 'system', 'settings'),
('system.backup', 'Respaldos', 'Puede crear y restaurar respaldos', 'system', 'backup'),
('system.logs', 'Ver Logs', 'Puede ver logs de actividad del sistema', 'system', 'logs');

-- Assign permissions to roles
-- Super Admin: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin';

-- Admin: Most permissions except system critical ones
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' 
AND p.name NOT IN ('system.backup', 'users.delete');

-- Manager: Lead management and team analytics
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'manager' 
AND p.name IN (
    'leads.create', 'leads.read', 'leads.update', 'leads.assign', 'leads.view_all',
    'interactions.create', 'interactions.read', 'interactions.update',
    'analytics.read', 'analytics.export',
    'users.read'
);

-- Sales Rep: Own leads and interactions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'sales_rep' 
AND p.name IN (
    'leads.create', 'leads.read', 'leads.update',
    'interactions.create', 'interactions.read', 'interactions.update',
    'analytics.read'
);

-- Viewer: Read-only access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'viewer' 
AND p.name IN (
    'leads.read', 'interactions.read', 'analytics.read', 'users.read'
);

-- Insert default admin user
INSERT INTO users (email, password, name, role_id, status, email_verified) 
SELECT 'admin@crm.com', 'admin123', 'Admin Usuario', r.id, 'ACTIVE', true
FROM roles r WHERE r.name = 'super_admin';

-- Insert sample users with different roles
INSERT INTO users (email, password, name, role_id, status, email_verified) 
SELECT 'manager@crm.com', 'manager123', 'Gerente Ventas', r.id, 'ACTIVE', true
FROM roles r WHERE r.name = 'manager';

INSERT INTO users (email, password, name, role_id, status, email_verified) 
SELECT 'sales@crm.com', 'sales123', 'Vendedor Principal', r.id, 'ACTIVE', true
FROM roles r WHERE r.name = 'sales_rep';

-- Create user profiles for sample users
INSERT INTO user_profiles (user_id, department, position, bio)
SELECT u.id, 'Administración', 'Administrador del Sistema', 'Responsable de la gestión completa del CRM'
FROM users u WHERE u.email = 'admin@crm.com';

INSERT INTO user_profiles (user_id, department, position, bio)
SELECT u.id, 'Ventas', 'Gerente de Ventas', 'Responsable del equipo de ventas y estrategias comerciales'
FROM users u WHERE u.email = 'manager@crm.com';

INSERT INTO user_profiles (user_id, department, position, bio)
SELECT u.id, 'Ventas', 'Representante de Ventas', 'Especialista en atención y conversión de leads'
FROM users u WHERE u.email = 'sales@crm.com';

-- Insert default tags
INSERT INTO tags (name, color, created_by) 
SELECT 'Corporativo', '#3B82F6', u.id FROM users u WHERE u.email = 'admin@crm.com'
UNION ALL
SELECT 'PyME', '#10B981', u.id FROM users u WHERE u.email = 'admin@crm.com'
UNION ALL
SELECT 'Alto Valor', '#F59E0B', u.id FROM users u WHERE u.email = 'admin@crm.com'
UNION ALL
SELECT 'Tecnología', '#8B5CF6', u.id FROM users u WHERE u.email = 'admin@crm.com'
UNION ALL
SELECT 'Urgente', '#EF4444', u.id FROM users u WHERE u.email = 'admin@crm.com'
UNION ALL
SELECT 'Seguimiento', '#6B7280', u.id FROM users u WHERE u.email = 'admin@crm.com';

-- Insert sample leads
INSERT INTO leads (name, email, phone, company, status, source, potential_value, responsible_id, created_by, notes) 
SELECT 
    'Juan Pérez',
    'juan@empresa.com',
    '+34 600 123 456',
    'Empresa ABC',
    'NEW',
    'WEBSITE',
    5000.00,
    u.id,
    u.id,
    'Lead interesado en nuestros servicios'
FROM users u WHERE u.email = 'sales@crm.com';

INSERT INTO leads (name, email, phone, company, status, source, potential_value, responsible_id, created_by, notes, last_interaction_date) 
SELECT 
    'María García',
    'maria@startup.com',
    '+34 600 789 012',
    'Startup XYZ',
    'CONTACTED',
    'REFERRAL',
    3000.00,
    u.id,
    u.id,
    'Primera llamada realizada, interesada',
    CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'sales@crm.com';

-- Insert sample interaction
INSERT INTO interactions (lead_id, user_id, type, channel, result, duration, notes)
SELECT 
    l.id,
    u.id,
    'CALL',
    'MOBILE',
    'SUCCESSFUL',
    15,
    'Primera llamada, muy receptiva. Programar demo.'
FROM leads l, users u 
WHERE l.email = 'maria@startup.com' AND u.email = 'sales@crm.com';

-- Insert sample lead tags
INSERT INTO lead_tags (lead_id, tag_id)
SELECT l.id, t.id
FROM leads l, tags t
WHERE l.email = 'juan@empresa.com' AND t.name IN ('Corporativo', 'Alto Valor');

INSERT INTO lead_tags (lead_id, tag_id)
SELECT l.id, t.id
FROM leads l, tags t
WHERE l.email = 'maria@startup.com' AND t.name IN ('PyME', 'Tecnología');

-- Views for common queries with role information
CREATE VIEW user_details AS
SELECT 
    u.*,
    r.name as role_name,
    r.display_name as role_display_name,
    r.description as role_description,
    up.department,
    up.position,
    up.bio,
    up.avatar_url,
    manager.name as manager_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN users manager ON up.manager_id = manager.id;

CREATE VIEW user_permissions AS
SELECT 
    u.id as user_id,
    u.email,
    u.name as user_name,
    r.name as role_name,
    p.name as permission_name,
    p.display_name as permission_display_name,
    p.module,
    p.action
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.status = 'ACTIVE' AND r.is_active = true;

CREATE VIEW lead_summary AS
SELECT 
    l.*,
    responsible.name as responsible_name,
    responsible.email as responsible_email,
    creator.name as created_by_name,
    COUNT(i.id) as interaction_count,
    MAX(i.created_at) as last_interaction_date_calc
FROM leads l
LEFT JOIN users responsible ON l.responsible_id = responsible.id
LEFT JOIN users creator ON l.created_by = creator.id
LEFT JOIN interactions i ON l.id = i.lead_id
GROUP BY l.id, responsible.name, responsible.email, creator.name;

CREATE VIEW interaction_summary AS
SELECT 
    i.*,
    l.name as lead_name,
    l.company as lead_company,
    u.name as user_name,
    u.email as user_email
FROM interactions i
JOIN leads l ON i.lead_id = l.id
JOIN users u ON i.user_id = u.id;

-- Function to check user permissions
CREATE OR REPLACE FUNCTION user_has_permission(user_email VARCHAR, permission_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1 
        FROM user_permissions up 
        WHERE up.email = user_email 
        AND up.permission_name = permission_name
    ) INTO has_perm;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_email VARCHAR)
RETURNS TABLE(permission_name VARCHAR, module VARCHAR, action VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT up.permission_name, up.module, up.action
    FROM user_permissions up
    WHERE up.email = user_email;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your environment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO crm_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO crm_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO crm_user;