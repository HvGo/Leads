-- CRM System Database Schema for PostgreSQL
-- Execute this script in your local PostgreSQL database

-- Create database (run this separately as superuser)
-- CREATE DATABASE crm_system;
-- \c crm_system;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
    last_interaction_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
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

-- Create indexes for better performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_responsible_id ON leads(responsible_id);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_last_interaction_date ON leads(last_interaction_date);

CREATE INDEX idx_interactions_lead_id ON interactions(lead_id);
CREATE INDEX idx_interactions_user_id ON interactions(user_id);
CREATE INDEX idx_interactions_type ON interactions(type);
CREATE INDEX idx_interactions_created_at ON interactions(created_at);

CREATE INDEX idx_lead_tags_lead_id ON lead_tags(lead_id);
CREATE INDEX idx_lead_tags_tag_id ON lead_tags(tag_id);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

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

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON interactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password, name, role, status) VALUES 
('admin@crm.com', 'admin123', 'Admin Usuario', 'ADMIN', 'ACTIVE');

-- Insert default tags
INSERT INTO tags (name, color) VALUES 
('Corporativo', '#3B82F6'),
('PyME', '#10B981'),
('Alto Valor', '#F59E0B'),
('Tecnología', '#8B5CF6'),
('Urgente', '#EF4444'),
('Seguimiento', '#6B7280');

-- Insert sample leads (optional)
INSERT INTO leads (name, email, phone, company, status, source, potential_value, responsible_id, notes) 
SELECT 
    'Juan Pérez',
    'juan@empresa.com',
    '+34 600 123 456',
    'Empresa ABC',
    'NEW',
    'WEBSITE',
    5000.00,
    u.id,
    'Lead interesado en nuestros servicios'
FROM users u WHERE u.email = 'admin@crm.com';

INSERT INTO leads (name, email, phone, company, status, source, potential_value, responsible_id, notes, last_interaction_date) 
SELECT 
    'María García',
    'maria@startup.com',
    '+34 600 789 012',
    'Startup XYZ',
    'CONTACTED',
    'REFERRAL',
    3000.00,
    u.id,
    'Primera llamada realizada, interesada',
    CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'admin@crm.com';

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
WHERE l.email = 'maria@startup.com' AND u.email = 'admin@crm.com';

-- Insert sample lead tags
INSERT INTO lead_tags (lead_id, tag_id)
SELECT l.id, t.id
FROM leads l, tags t
WHERE l.email = 'juan@empresa.com' AND t.name IN ('Corporativo', 'Alto Valor');

INSERT INTO lead_tags (lead_id, tag_id)
SELECT l.id, t.id
FROM leads l, tags t
WHERE l.email = 'maria@startup.com' AND t.name IN ('PyME', 'Tecnología');

-- Views for common queries
CREATE VIEW lead_summary AS
SELECT 
    l.*,
    u.name as responsible_name,
    u.email as responsible_email,
    COUNT(i.id) as interaction_count,
    MAX(i.created_at) as last_interaction_date_calc
FROM leads l
LEFT JOIN users u ON l.responsible_id = u.id
LEFT JOIN interactions i ON l.id = i.lead_id
GROUP BY l.id, u.name, u.email;

CREATE VIEW interaction_summary AS
SELECT 
    i.*,
    l.name as lead_name,
    l.company as lead_company,
    u.name as user_name
FROM interactions i
JOIN leads l ON i.lead_id = l.id
JOIN users u ON i.user_id = u.id;

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO crm_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO crm_user;