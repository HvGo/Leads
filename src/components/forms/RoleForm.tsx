import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { apiService } from '../../services/api';
import { Shield, Users, Settings, BarChart3, Phone, User } from 'lucide-react';

interface RoleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  mode: 'create' | 'edit';
}

interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string;
  module: string;
  action: string;
}

interface PermissionsByModule {
  [module: string]: Permission[];
}

export const RoleForm: React.FC<RoleFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode
}) => {
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    is_active: true,
    permissions: [] as string[]
  });
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsByModule, setPermissionsByModule] = useState<PermissionsByModule>({});
  const [loading, setLoading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadPermissions();
      
      if (initialData && mode === 'edit') {
        setFormData({
          name: initialData.name || '',
          display_name: initialData.display_name || '',
          description: initialData.description || '',
          is_active: initialData.is_active !== false,
          permissions: initialData.permissions?.map((p: any) => p.name) || []
        });
      } else {
        setFormData({
          name: '',
          display_name: '',
          description: '',
          is_active: true,
          permissions: []
        });
      }
      
      setErrors({});
      setSubmitError('');
    }
  }, [isOpen, initialData, mode]);

  const loadPermissions = async () => {
    try {
      setLoadingPermissions(true);
      const response = await apiService.get('/permissions');
      
      if (response.data) {
        setPermissions(response.data.permissions || []);
        setPermissionsByModule(response.data.permissionsByModule || {});
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del rol es requerido';
    } else if (!/^[a-z_]+$/.test(formData.name)) {
      newErrors.name = 'El nombre debe contener solo letras minúsculas y guiones bajos';
    }

    if (!formData.display_name.trim()) {
      newErrors.display_name = 'El nombre para mostrar es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitError('');
    setLoading(true);
    
    try {
      await onSubmit(formData);
      onClose();
      
      // Reset form only if creating
      if (mode === 'create') {
        setFormData({
          name: '',
          display_name: '',
          description: '',
          is_active: true,
          permissions: []
        });
        setErrors({});
      }
    } catch (error: any) {
      console.error('Error submitting role:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      setSubmitError('Error al ' + (mode === 'create' ? 'crear' : 'actualizar') + ' el rol: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError('');
    }
  };

  const handlePermissionToggle = (permissionName: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionName)
        ? prev.permissions.filter(p => p !== permissionName)
        : [...prev.permissions, permissionName]
    }));
  };

  const handleModuleToggle = (module: string) => {
    const modulePermissions = permissionsByModule[module] || [];
    const modulePermissionNames = modulePermissions.map(p => p.name);
    const allSelected = modulePermissionNames.every(name => formData.permissions.includes(name));
    
    if (allSelected) {
      // Deselect all permissions in this module
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !modulePermissionNames.includes(p))
      }));
    } else {
      // Select all permissions in this module
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...modulePermissionNames])]
      }));
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo Rol' : 'Editar Rol'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Submit Error */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error al procesar el rol</h3>
                <p className="text-sm text-red-700 mt-1">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Nombre del Rol"
            leftIcon={<Shield className="h-5 w-5 text-gray-400" />}
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={errors.name}
            placeholder="ej: sales_manager"
            helperText="Solo letras minúsculas y guiones bajos"
            required
            disabled={mode === 'edit' && ['super_admin', 'admin'].includes(initialData?.name)}
          />

          <Input
            label="Nombre para Mostrar"
            value={formData.display_name}
            onChange={(e) => handleInputChange('display_name', e.target.value)}
            error={errors.display_name}
            placeholder="ej: Gerente de Ventas"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Describe las responsabilidades y alcance de este rol..."
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => handleInputChange('is_active', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
            Rol activo
          </label>
        </div>

        {/* Permissions */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Permisos</h3>
          
          {loadingPermissions ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Cargando permisos...</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(permissionsByModule).map(([module, modulePermissions]) => {
                const ModuleIcon = moduleIcons[module] || Shield;
                const allSelected = modulePermissions.every(p => formData.permissions.includes(p.name));
                const someSelected = modulePermissions.some(p => formData.permissions.includes(p.name));
                
                return (
                  <div key={module} className="border border-gray-200 rounded-lg">
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <ModuleIcon className="h-5 w-5 text-gray-600" />
                          <h4 className="font-medium text-gray-900">
                            {moduleLabels[module] || module}
                          </h4>
                          <span className="text-sm text-gray-500">
                            ({modulePermissions.length} permisos)
                          </span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => handleModuleToggle(module)}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            allSelected 
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              : someSelected
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {allSelected ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {modulePermissions.map(permission => (
                          <label
                            key={permission.id}
                            className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(permission.name)}
                              onChange={() => handlePermissionToggle(permission.name)}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {permission.display_name}
                              </p>
                              <p className="text-xs text-gray-500 font-mono">
                                {permission.name}
                              </p>
                              {permission.description && (
                                <p className="text-xs text-gray-600 mt-1">
                                  {permission.description}
                                </p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Permisos seleccionados:</strong> {formData.permissions.length} de {permissions.length}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={loading}
            disabled={loading || loadingPermissions}
          >
            {mode === 'create' ? 'Crear Rol' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};