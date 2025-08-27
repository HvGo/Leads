import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, User, Shield, Clock, Mail, Phone, AlertTriangle } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { UserForm } from '../components/forms/UserForm';

interface UserData {
  id: string;
  email: string;
  name: string;
  phone?: string;
  status: string;
  role: string;
  roleDisplayName?: string;
  lastLogin?: string;
  createdAt: string;
  _count: {
    leadsAssigned: number;
    interactions: number;
  };
}

const statusLabels: { [key: string]: string } = {
  'ACTIVE': 'Activo',
  'INACTIVE': 'Inactivo',
  'SUSPENDED': 'Suspendido'
};

const statusColors: { [key: string]: 'default' | 'success' | 'warning' | 'error' | 'info' } = {
  'ACTIVE': 'success',
  'INACTIVE': 'default',
  'SUSPENDED': 'error'
};

export const UsersPage: React.FC = () => {
  const { hasPermission, canAccessUser, user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiService.get('/users');

      if (response.data && response.data.users) {
        // Filtrar usuarios según permisos
        const filteredUsers = response.data.users.filter((userData: UserData) =>
          canAccessUser(userData.id)
        );
        setUsers(filteredUsers);
      } else {
        setUsers([]);
      }
    } catch (error: any) {
      console.error('Error loading users:', error);
      setError('Error al cargar usuarios');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (data: any) => {
    try {
      await apiService.post('/users', data);
      loadUsers();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleEditUser = (user: UserData) => {
    // Verificar si puede editar este usuario
    if (!canAccessUser(user.id)) {
      alert('No tienes permisos para editar este usuario');
      return;
    }
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (data: any) => {
    if (!selectedUser) return;

    try {
      await apiService.put(`/users/${selectedUser.id}`, data);
      loadUsers();
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = (user: UserData) => {
    // Verificar si puede eliminar este usuario
    if (!canAccessUser(user.id) || !hasPermission('users.delete')) {
      alert('No tienes permisos para eliminar este usuario');
      return;
    }

    // No permitir eliminar super admins (excepto por otro super admin)
    if (user.role === 'super_admin' && user?.role !== 'super_admin') {
      alert('No puedes eliminar un Super Administrador');
      return;
    }

    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await apiService.delete(`/users/${userToDelete.id}`);
      loadUsers();
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!user) return false;

    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Función para verificar si puede mostrar botones de acción
  const canShowActions = (userItem: UserData) => {
    return canAccessUser(userItem.id);
  };

  // Función para verificar si puede editar
  const canEdit = (userItem: UserData) => {
    return canAccessUser(userItem.id) && hasPermission('users.update');
  };

  // Función para verificar si puede eliminar
  const canDelete = (userItem: UserData) => {
    // No puede eliminar su propio usuario
    if (userItem.id === user?.id) return false;

    // Solo super admin puede eliminar otros super admins
    if (userItem.role === 'super_admin' && user?.role !== 'super_admin') return false;

    return canAccessUser(userItem.id) && hasPermission('users.delete');
  };

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
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">{error}</p>
        <Button onClick={loadUsers} className="mt-4">
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'super_admin' || user?.role === 'admin'
              ? 'Administra usuarios, roles y permisos del sistema'
              : 'Ver información de usuarios del sistema'
            }
          </p>
        </div>

        {hasPermission('users.create') && (
          <Button
            className="mt-4 sm:mt-0"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los estados</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <div className="flex items-center text-sm text-gray-600">
            <User className="h-4 w-4 mr-2" />
            Total: {filteredUsers.length} usuarios
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {user?.role === 'super_admin' || user?.role === 'admin'
                ? 'No se encontraron usuarios'
                : 'No tienes acceso a otros usuarios'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
            {filteredUsers.map((userItem) => (
              <div key={userItem.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{userItem.name || 'Sin nombre'}</h3>
                      <p className="text-sm text-gray-500">
                        {userItem.roleDisplayName || userItem.role || 'Sin rol'}
                      </p>
                    </div>
                  </div>

                  <Badge variant={statusColors[userItem.status] || 'default'}>
                    {statusLabels[userItem.status] || userItem.status}
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {userItem.email || 'Sin email'}
                  </div>

                  {userItem.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {userItem.phone}
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    {userItem.lastLogin
                      ? `Último acceso: ${new Date(userItem.lastLogin).toLocaleDateString('es-ES')}`
                      : 'Sin accesos registrados'
                    }
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Shield className="h-4 w-4 mr-2 text-gray-400" />
                    Miembro desde {new Date(userItem.createdAt).toLocaleDateString('es-ES')}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex space-x-4 text-sm text-gray-600">
                    <span>{userItem._count?.leadsAssigned || 0} leads</span>
                    <span>{userItem._count?.interactions || 0} interacciones</span>
                  </div>

                  {canShowActions(userItem) && (
                    <div className="flex space-x-2">
                      {canEdit(userItem) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(userItem)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}

                      {canDelete(userItem) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(userItem)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
              <p className="text-3xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-3xl font-bold text-gray-900">
                {users.filter(u => u.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conexiones Hoy</p>
              <p className="text-3xl font-bold text-gray-900">
                {filteredUsers.filter(u => u.lastLogin &&
                  new Date(u.lastLogin).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Roles Únicos</p>
              <p className="text-3xl font-bold text-gray-900">
                {new Set(filteredUsers.map(u => u.role)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {hasPermission('users.create') && (
        <UserForm
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
          mode="create"
        />
      )}

      {/* Edit User Modal */}
      <UserForm
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onSubmit={handleUpdateUser}
        initialData={selectedUser}
        mode="edit"
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && userToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteConfirm(false)} />

            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-red-100 rounded-full mr-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Eliminar Usuario</h3>
                  <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                ¿Estás seguro de que deseas eliminar al usuario <strong>{userToDelete.name}</strong>?
                Todos los datos asociados se perderán permanentemente.
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
                  onClick={confirmDeleteUser}
                >
                  Eliminar Usuario
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};