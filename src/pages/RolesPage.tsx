import React, { useState, useEffect } from 'react';
import { Plus, Shield, Users, Edit, Trash2, AlertTriangle, Settings } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { RoleForm } from '../components/forms/RoleForm';

interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  is_active: boolean;
  user_count: number;
  permissions: Array<{
    name: string;
    display_name: string;
    module: string;
    action: string;
  }>;
  created_at: string;
  updated_at: string;
}

export const RolesPage: React.FC = () => {
  const { hasPermission, user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.get('/roles');
      
      if (response.data && response.data.roles) {
        setRoles(response.data.roles);
      } else {
        setRoles([]);
      }
    } catch (error: any) {
      console.error('Error loading roles:', error);
      setError('Error al cargar roles');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (data: any) => {
    try {
      await apiService.post('/roles', data);
      loadRoles();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setShowEditModal(true);
  };

  const handleUpdateRole = async (data: any) => {
    if (!selectedRole) return;
    
    try {
      await apiService.put(`/roles/${selectedRole.id}`, data);
      loadRoles();
      setShowEditModal(false);
      setSelectedRole(null);
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  };

  const handleDeleteRole = (role: Role) => {
    if (role.user_count > 0) {
      alert('No se puede eliminar un rol que tiene usuarios asignados');
      return;
    }
    
    if (['super_admin', 'admin'].includes(role.name) && user?.role !== 'super_admin') {
      alert('No tienes permisos para eliminar este rol');
      return;
    }
    
    setRoleToDelete(role);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;
    
    try {
      await apiService.delete(`/roles/${roleToDelete.id}`);
      loadRoles();
      setShowDeleteConfirm(false);
      setRoleToDelete(null);
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  const getPermissionsByModule = (permissions: Role['permissions']) => {
    return permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {} as { [key: string]: Role['permissions'] });
  };

  const moduleLabels: { [key: string]: string } = {
    'users': 'Usuarios',
    'leads': 'Leads',
    'interactions': 'Interacciones',
    'analytics': 'Análisis',
    'system': 'Sistema'
  };

  if (!hasPermission('users.manage_roles')) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No tienes permisos para gestionar roles</p>
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
        <Button onClick={loadRoles} className="mt-4">
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Roles</h1>
          <p className="text-gray-600 mt-1">
            Administra roles y permisos del sistema
          </p>
        </div>
        
        <Button 
          className="mt-4 sm:mt-0"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Rol
        </Button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {roles.map((role) => {
          const permissionsByModule = getPermissionsByModule(role.permissions || []);
          
          return (
            <div key={role.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-purple-500 rounded-full flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{role.display_name}</h3>
                    <p className="text-sm text-gray-500">{role.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant={role.is_active ? 'success' : 'default'}>
                    {role.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {role.description || 'Sin descripción'}
              </p>

              {/* Permissions by Module */}
              <div className="space-y-3 mb-4">
                <h4 className="text-sm font-medium text-gray-900">Permisos por Módulo:</h4>
                {Object.keys(permissionsByModule).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(permissionsByModule).map(([module, permissions]) => (
                      <div key={module} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {moduleLabels[module] || module}:
                        </span>
                        <Badge variant="info" size="sm">
                          {permissions.length}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Sin permisos asignados</p>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{role.user_count || 0} usuarios</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditRole(role)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  {!['super_admin', 'admin'].includes(role.name) && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteRole(role)}
                      disabled={role.user_count > 0}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Roles</p>
              <p className="text-3xl font-bold text-gray-900">{roles.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Settings className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-3xl font-bold text-gray-900">
                {roles.filter(r => r.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Con Usuarios</p>
              <p className="text-3xl font-bold text-gray-900">
                {roles.filter(r => r.user_count > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Permisos Únicos</p>
              <p className="text-3xl font-bold text-gray-900">
                {new Set(roles.flatMap(r => r.permissions?.map(p => p.name) || [])).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Role Modal */}
      <RoleForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateRole}
        mode="create"
      />

      {/* Edit Role Modal */}
      <RoleForm
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRole(null);
        }}
        onSubmit={handleUpdateRole}
        initialData={selectedRole}
        mode="edit"
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && roleToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteConfirm(false)} />
            
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-red-100 rounded-full mr-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Eliminar Rol</h3>
                  <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                ¿Estás seguro de que deseas eliminar el rol <strong>{roleToDelete.display_name}</strong>?
                Todos los permisos asociados se perderán permanentemente.
              </p>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmDeleteRole}
                >
                  Eliminar Rol
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};