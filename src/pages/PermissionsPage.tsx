import React, { useState, useEffect } from 'react';
import { Shield, Search, Filter, Users, Settings, BarChart3, Phone, User } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';

interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string;
  module: string;
  action: string;
  created_at: string;
}

interface PermissionsByModule {
  [module: string]: Permission[];
}

export const PermissionsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsByModule, setPermissionsByModule] = useState<PermissionsByModule>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.get('/permissions');
      
      if (response.data) {
        const perms = response.data.permissions || [];
        const permsByModule = response.data.permissionsByModule || {};
        
        setPermissions(perms);
        setPermissionsByModule(permsByModule);
      } else {
        setPermissions([]);
        setPermissionsByModule({});
      }
    } catch (error: any) {
      console.error('Error loading permissions:', error);
      setError('Error al cargar permisos');
      setPermissions([]);
      setPermissionsByModule({});
    } finally {
      setLoading(false);
    }
  };

  const moduleLabels: { [key: string]: string } = {
    'users': 'Usuarios',
    'leads': 'Leads',
    'interactions': 'Interacciones',
    'analytics': 'Análisis',
    'system': 'Sistema'
  };

  const moduleIcons: { [key: string]: React.ComponentType<any> } = {
    'users': User,
    'leads': Users,
    'interactions': Phone,
    'analytics': BarChart3,
    'system': Settings
  };

  const actionLabels: { [key: string]: string } = {
    'create': 'Crear',
    'read': 'Leer',
    'update': 'Actualizar',
    'delete': 'Eliminar',
    'manage': 'Gestionar',
    'assign': 'Asignar',
    'view_all': 'Ver Todo',
    'export': 'Exportar',
    'advanced': 'Avanzado',
    'settings': 'Configuración',
    'backup': 'Respaldos',
    'logs': 'Logs'
  };

  const actionColors: { [key: string]: 'default' | 'success' | 'warning' | 'error' | 'info' } = {
    'create': 'success',
    'read': 'info',
    'update': 'warning',
    'delete': 'error',
    'manage': 'warning',
    'assign': 'info',
    'view_all': 'info',
    'export': 'default',
    'advanced': 'warning',
    'settings': 'default',
    'backup': 'error',
    'logs': 'default'
  };

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = !moduleFilter || permission.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const filteredModules = Object.keys(permissionsByModule).filter(module => 
    !moduleFilter || module === moduleFilter
  );

  if (!hasPermission('users.manage_roles')) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No tienes permisos para ver los permisos del sistema</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">{error}</p>
        <Button onClick={loadPermissions} className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Permisos del Sistema</h1>
          <p className="text-gray-600 mt-1">
            Visualiza todos los permisos disponibles organizados por módulo
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar permisos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los módulos</option>
            {Object.keys(moduleLabels).map(module => (
              <option key={module} value={module}>{moduleLabels[module]}</option>
            ))}
          </select>

          <div className="flex items-center text-sm text-gray-600">
            <Shield className="h-4 w-4 mr-2" />
            Total: {filteredPermissions.length} permisos
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Permisos</p>
              <p className="text-3xl font-bold text-gray-900">{permissions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Settings className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Módulos</p>
              <p className="text-3xl font-bold text-gray-900">{Object.keys(permissionsByModule).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <User className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Acciones Únicas</p>
              <p className="text-3xl font-bold text-gray-900">
                {new Set(permissions.map(p => p.action)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Filter className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Filtrados</p>
              <p className="text-3xl font-bold text-gray-900">{filteredPermissions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions by Module */}
      <div className="space-y-6">
        {filteredModules.map(module => {
          const modulePermissions = permissionsByModule[module].filter(permission => {
            const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 permission.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 permission.description?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
          });

          if (modulePermissions.length === 0) return null;

          const ModuleIcon = moduleIcons[module] || Shield;

          return (
            <div key={module} className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ModuleIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {moduleLabels[module] || module}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {modulePermissions.length} permisos disponibles
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modulePermissions.map(permission => (
                    <div key={permission.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {permission.display_name}
                          </h4>
                          <p className="text-xs text-gray-500 font-mono mt-1">
                            {permission.name}
                          </p>
                        </div>
                        <Badge 
                          variant={actionColors[permission.action] || 'default'} 
                          size="sm"
                        >
                          {actionLabels[permission.action] || permission.action}
                        </Badge>
                      </div>
                      
                      {permission.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          {permission.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPermissions.length === 0 && (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No se encontraron permisos que coincidan con los filtros</p>
        </div>
      )}
    </div>
  );
};