import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { apiService } from '../../services/api';
import { Shield, Users, Settings, Check } from 'lucide-react';

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

export const RoleForm: React.FC<RoleFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode
}) => {
    const [formData, setFormData] = useState({
        name: '',
        displayName: '',
        description: '',
        isActive: true,
        permissions: [] as string[]
    });
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [permissionsByModule, setPermissionsByModule] = useState<{ [key: string]: Permission[] }>({});
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (isOpen) {
            loadPermissions();

            if (initialData && mode === 'edit') {
                setFormData({
                    name: initialData.name || '',
                    displayName: initialData.display_name || '',
                    description: initialData.description || '',
                    isActive: initialData.is_active !== false,
                    permissions: initialData.permissions?.map((p: any) => p.name) || []
                });
            } else {
                setFormData({
                    name: '',
                    displayName: '',
                    description: '',
                    isActive: true,
                    permissions: []
                });
            }
        }
    }, [isOpen, initialData, mode]);

    const loadPermissions = async () => {
        try {
            const response = await apiService.get('/permissions');
            setPermissions(response.data.permissions || []);
            setPermissionsByModule(response.data.permissionsByModule || {});
        } catch (error) {
            console.error('Error loading permissions:', error);
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre del rol es requerido';
        } else if (!/^[a-z_]+$/.test(formData.name)) {
            newErrors.name = 'El nombre debe contener solo letras minúsculas y guiones bajos';
        }

        if (!formData.displayName.trim()) {
            newErrors.displayName = 'El nombre para mostrar es requerido';
        }

        if (formData.permissions.length === 0) {
            newErrors.permissions = 'Debe seleccionar al menos un permiso';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handlePermissionToggle = (permissionName: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permissionName)
                ? prev.permissions.filter(p => p !== permissionName)
                : [...prev.permissions, permissionName]
        }));

        if (errors.permissions) {
            setErrors(prev => ({
                ...prev,
                permissions: ''
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

    const actionLabels: { [key: string]: string } = {
        'create': 'Crear',
        'read': 'Ver',
        'update': 'Editar',
        'delete': 'Eliminar',
        'manage': 'Gestionar',
        'assign': 'Asignar',
        'view_all': 'Ver Todos',
        'export': 'Exportar',
        'advanced': 'Avanzado',
        'settings': 'Configuración',
        'backup': 'Respaldos',
        'logs': 'Logs'
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'create' ? 'Nuevo Rol' : 'Editar Rol'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Información Básica</h4>

                        <Input
                            label="Nombre del Rol"
                            leftIcon={<Shield className="h-5 w-5 text-gray-400" />}
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value.toLowerCase().replace(/[^a-z_]/g, ''))}
                            error={errors.name}
                            placeholder="ej: custom_role"
                            helperText="Solo letras minúsculas y guiones bajos"
                            required
                            disabled={mode === 'edit' && ['super_admin', 'admin', 'manager', 'sales_rep', 'viewer'].includes(initialData?.name)}
                        />

                        <Input
                            label="Nombre para Mostrar"
                            leftIcon={<Users className="h-5 w-5 text-gray-400" />}
                            value={formData.displayName}
                            onChange={(e) => handleInputChange('displayName', e.target.value)}
                            error={errors.displayName}
                            placeholder="ej: Rol Personalizado"
                            required
                        />

                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                                Rol activo
                            </label>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Descripción</h4>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción del Rol
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={4}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Describe las responsabilidades y alcance de este rol..."
                            />
                        </div>
                    </div>
                </div>

                {/* Permissions */}
                <div>
                    <h4 className="font-medium text-gray-900 mb-4">Permisos del Rol</h4>
                    {errors.permissions && (
                        <p className="text-sm text-red-600 mb-4">{errors.permissions}</p>
                    )}

                    <div className="space-y-6">
                        {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
                            <div key={module} className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <h5 className="font-medium text-gray-900 flex items-center">
                                        <Settings className="h-4 w-4 mr-2" />
                                        {moduleLabels[module] || module}
                                    </h5>
                                    <div className="flex space-x-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const modulePermissionNames = modulePermissions.map(p => p.name);
                                                const allSelected = modulePermissionNames.every(name => formData.permissions.includes(name));

                                                if (allSelected) {
                                                    // Deseleccionar todos
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        permissions: prev.permissions.filter(p => !modulePermissionNames.includes(p))
                                                    }));
                                                } else {
                                                    // Seleccionar todos
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        permissions: [...new Set([...prev.permissions, ...modulePermissionNames])]
                                                    }));
                                                }
                                            }}
                                        >
                                            {modulePermissions.every(p => formData.permissions.includes(p.name)) ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {modulePermissions.map((permission) => (
                                        <div
                                            key={permission.id}
                                            className={`
                        flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors
                        ${formData.permissions.includes(permission.name)
                                                    ? 'bg-blue-50 border-blue-200'
                                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                                }
                      `}
                                            onClick={() => handlePermissionToggle(permission.name)}
                                        >
                                            <div className={`
                        flex items-center justify-center w-5 h-5 rounded border-2 transition-colors
                        ${formData.permissions.includes(permission.name)
                                                    ? 'bg-blue-600 border-blue-600'
                                                    : 'border-gray-300'
                                                }
                      `}>
                                                {formData.permissions.includes(permission.name) && (
                                                    <Check className="h-3 w-3 text-white" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {actionLabels[permission.action] || permission.action}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {permission.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Selected Permissions Summary */}
                {formData.permissions.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h5 className="font-medium text-blue-900 mb-2">
                            Permisos Seleccionados ({formData.permissions.length})
                        </h5>
                        <div className="flex flex-wrap gap-2">
                            {formData.permissions.map((permissionName) => {
                                const permission = permissions.find(p => p.name === permissionName);
                                return (
                                    <span
                                        key={permissionName}
                                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                        {permission?.display_name || permissionName}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

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
                    >
                        {mode === 'create' ? 'Crear Rol' : 'Guardar Cambios'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};