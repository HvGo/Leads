import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Shield, Building, FileText } from 'lucide-react';

interface UserFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: any;
    mode: 'create' | 'edit';
}

interface Role {
    id: string;
    name: string;
    display_name: string;
    description: string;
}

export const UserForm: React.FC<UserFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode
}) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        roleId: '',
        status: 'ACTIVE',
        department: '',
        position: '',
        bio: ''
    });
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (isOpen) {
            loadRoles();

            if (initialData && mode === 'edit') {
                setFormData({
                    name: initialData.name || '',
                    email: initialData.email || '',
                    phone: initialData.phone || '',
                    password: '',
                    confirmPassword: '',
                    roleId: initialData.role_id || '',
                    status: initialData.status || 'ACTIVE',
                    department: initialData.department || '',
                    position: initialData.position || '',
                    bio: initialData.bio || ''
                });
            } else {
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    password: '',
                    confirmPassword: '',
                    roleId: '',
                    status: 'ACTIVE',
                    department: '',
                    position: '',
                    bio: ''
                });
            }
        }
    }, [isOpen, initialData, mode]);

    const loadRoles = async () => {
        try {
            const response = await apiService.get('/roles');
            let availableRoles = response.data.roles || [];

            // Filtrar roles según permisos del usuario actual
            if (user?.role !== 'super_admin') {
                // Admin no puede crear super admins
                availableRoles = availableRoles.filter((role: Role) => role.name !== 'super_admin');
            }

            setRoles(availableRoles);
        } catch (error) {
            console.error('Error loading roles:', error);
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'El email no es válido';
        }

        if (mode === 'create') {
            if (!formData.password) {
                newErrors.password = 'La contraseña es requerida';
            } else if (formData.password.length < 6) {
                newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
            }

            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Las contraseñas no coinciden';
            }
        } else if (mode === 'edit' && formData.password) {
            if (formData.password.length < 6) {
                newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Las contraseñas no coinciden';
            }
        }

        if (!formData.roleId) {
            newErrors.roleId = 'El rol es requerido';
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
            const submitData = {
                ...formData,
                // Solo incluir password si se proporcionó
                ...(formData.password ? { password: formData.password } : {})
            };

            // Remover confirmPassword del objeto a enviar
            delete submitData.confirmPassword;

            await onSubmit(submitData);
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

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const statusOptions = [
        { value: 'ACTIVE', label: 'Activo' },
        { value: 'INACTIVE', label: 'Inactivo' },
        { value: 'SUSPENDED', label: 'Suspendido' }
    ];

    const roleOptions = roles.map(role => ({
        value: role.id,
        label: role.display_name
    }));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Información Básica</h4>

                        <Input
                            label="Nombre completo"
                            leftIcon={<User className="h-5 w-5 text-gray-400" />}
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            error={errors.name}
                            required
                        />

                        <Input
                            label="Email"
                            type="email"
                            leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            error={errors.email}
                            required
                        />

                        <Input
                            label="Teléfono"
                            leftIcon={<Phone className="h-5 w-5 text-gray-400" />}
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                        />

                        <Select
                            label="Estado"
                            options={statusOptions}
                            value={formData.status}
                            onChange={(value) => handleInputChange('status', value)}
                        />
                    </div>

                    {/* Security & Role */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Seguridad y Rol</h4>

                        <Input
                            label={mode === 'create' ? 'Contraseña' : 'Nueva Contraseña (opcional)'}
                            type="password"
                            leftIcon={<Shield className="h-5 w-5 text-gray-400" />}
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            error={errors.password}
                            required={mode === 'create'}
                            helperText={mode === 'edit' ? 'Dejar vacío para mantener la contraseña actual' : undefined}
                        />

                        <Input
                            label="Confirmar Contraseña"
                            type="password"
                            leftIcon={<Shield className="h-5 w-5 text-gray-400" />}
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            error={errors.confirmPassword}
                            required={mode === 'create' || !!formData.password}
                        />

                        <Select
                            label="Rol"
                            options={roleOptions}
                            value={formData.roleId}
                            onChange={(value) => handleInputChange('roleId', value)}
                            error={errors.roleId}
                            placeholder="Seleccionar rol..."
                            helperText={user?.role !== 'super_admin' ? 'Solo puedes asignar roles de nivel igual o inferior' : undefined}
                        />
                    </div>
                </div>

                {/* Profile Information */}
                <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Información del Perfil</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Departamento"
                            leftIcon={<Building className="h-5 w-5 text-gray-400" />}
                            value={formData.department}
                            onChange={(e) => handleInputChange('department', e.target.value)}
                            placeholder="Ej: Ventas, Marketing, IT"
                        />

                        <Input
                            label="Posición"
                            value={formData.position}
                            onChange={(e) => handleInputChange('position', e.target.value)}
                            placeholder="Ej: Gerente, Representante, Analista"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Biografía
                        </label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            rows={3}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Breve descripción del usuario, experiencia, responsabilidades..."
                        />
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
                    >
                        {mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};