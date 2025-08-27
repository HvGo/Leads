# CRM System - Sistema de Gestión de Leads con PostgreSQL

Sistema CRM profesional con base de datos PostgreSQL.

## 🚀 Características

- ✅ Gestión completa de leads
- ✅ Registro de interacciones
- ✅ Dashboard con métricas
- ✅ Sistema de priorización
- ✅ Interfaz moderna y responsiva
- ✅ Base de datos PostgreSQL
- ✅ Relaciones y consultas optimizadas

## 📋 Prerrequisitos

- Node.js (v18+)
- PostgreSQL (v12+)
- VSCode (recomendado)

## 🗄️ Configuración de Base de Datos

### 1. Instalar PostgreSQL
```bash
# Windows (con Chocolatey)
choco install postgresql

# macOS (con Homebrew)
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
```

### 2. Crear Base de Datos
```bash
# Conectar como superusuario
psql -U postgres

# Crear base de datos
CREATE DATABASE crm_system;

# Salir
\q
```

### 3. Ejecutar Script de Schema
```bash
# Ejecutar el script SQL
psql -U postgres -d crm_system -f database-schema.sql
```

### 4. Configurar Variables de Entorno
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales de PostgreSQL
```

## 🛠️ Instalación Rápida

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar el proyecto
npm run dev:all
```

## 🎯 Ejecutar desde VSCode

### Método 1: Debug (F5)
1. Abrir VSCode en la carpeta del proyecto
2. Presionar `F5`
3. Seleccionar `Launch Frontend & Backend`

### Método 2: Tasks
1. `Ctrl+Shift+P` → `Tasks: Run Task`
2. Seleccionar `Start Development`

### Método 3: Terminal
```bash
npm run dev:all
```

## 🌐 Acceso

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **API Health**: http://localhost:3001/api/health (incluye estado de BD)

## 🔑 Credenciales

```
Email: admin@crm.com
Contraseña: admin123
```

## 📊 Funcionalidades

### Dashboard
- Métricas en tiempo real
- Gráficos de leads por estado
- Top performers
- Actividad reciente

### Leads
- Lista completa con filtros
- Vista de priorización automática
- Detalles completos de cada lead
- Formulario de creación/edición

### Interacciones
- Registro detallado de contactos
- Historial por lead
- Múltiples tipos y canales

### Analytics
- Estadísticas de conversión
- Análisis por fuente
- Métricas de rendimiento

## 🗂️ Estructura Simple

```
crm-system/
├── src/                    # Frontend React
├── server.js              # Backend Node.js con PostgreSQL
├── database-schema.sql    # Schema de base de datos
├── .env                   # Variables de entorno
└── package.json           # Dependencias
```

## 🐘 Base de Datos PostgreSQL

### Tablas principales:
- **users**: Usuarios del sistema
- **leads**: Información de leads
- **interactions**: Historial de interacciones
- **tags**: Etiquetas para categorizar leads
- **lead_tags**: Relación leads-etiquetas

### Características:
- ✅ **UUIDs** como claves primarias
- ✅ **Índices optimizados** para consultas rápidas
- ✅ **Triggers** para timestamps automáticos
- ✅ **Vistas** para consultas complejas
- ✅ **Relaciones** con integridad referencial

## 💾 Migración desde JSON

Si tenías datos en `data.json`, el sistema ahora usa PostgreSQL. Los datos de ejemplo se crean automáticamente con el script SQL.

## 🔧 Scripts Disponibles

```bash
npm run dev          # Solo frontend
npm run server       # Solo backend
npm run dev:all      # Ambos simultáneamente
npm run build        # Build para producción
```

## 🐛 Solución de Problemas

**Error de conexión a PostgreSQL:**
- Verificar que PostgreSQL esté ejecutándose
- Revisar credenciales en `.env`
- Confirmar que la base de datos `crm_system` existe

**Puerto ocupado:**
- Cambiar PORT en server.js (línea 8)

**Error de permisos PostgreSQL:**
```bash
# Cambiar contraseña de postgres
sudo -u postgres psql
ALTER USER postgres PASSWORD 'postgres';
```

**Error de permisos:**
```bash
sudo npm install
```

**Limpiar caché:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Recrear base de datos:**
```bash
psql -U postgres
DROP DATABASE IF EXISTS crm_system;
CREATE DATABASE crm_system;
\q
psql -U postgres -d crm_system -f database-schema.sql
```

---

**Sistema CRM profesional con PostgreSQL** 🐘🎉