import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { userService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User, Building, Mail, Phone, DollarSign, FileText } from 'lucide-react';

interface LeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  mode: 'create' | 'edit';
}

interface User {
  id: string;
  name: string;
  email: string;
}

export const LeadForm: React.FC<LeadFormProps> = ({
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
    company: '',
    position: '',
    source: 'OTHER',
    segment: '',
    potentialValue: '',
    notes: '',
    responsibleId: '',
    tags: ''
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      loadUsers();

      if (initialData && mode === 'edit') {
        setFormData({
          name: initialData.name || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          company: initialData.company || '',
          position: initialData.position || '',
          source: initialData.source || 'OTHER',
          segment: initialData.segment || '',
          potentialValue: initialData.potentialValue?.toString() || '',
          notes: initialData.notes || '',
          responsibleId: initialData.responsible?.id || '',
          tags: initialData.tags?.join(', ') || ''
        });
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          position: '',
          source: 'OTHER',
          segment: '',
          potentialValue: '',
          notes: '',
          // Si es sales_rep, asignar automáticamente a sí mismo
          responsibleId: user?.role === 'sales_rep' ? user.id : '',
          tags: ''
        });
      }
    }
  }, [isOpen, initialData, mode]);

  const loadUsers = async () => {
    try {
      const response = await userService.getAll();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (formData.potentialValue && isNaN(Number(formData.potentialValue))) {
      newErrors.potentialValue = 'El valor potencial debe ser un número';
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
        potentialValue: formData.potentialValue ? parseFloat(formData.potentialValue) : null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
      };

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

  const sourceOptions = [
    { value: 'WEBSITE', label: 'Sitio Web' },
    { value: 'REFERRAL', label: 'Referido' },
    { value: 'SOCIAL_MEDIA', label: 'Redes Sociales' },
    { value: 'EMAIL_CAMPAIGN', label: 'Campaña Email' },
    { value: 'PHONE_CALL', label: 'Llamada Telefónica' },
    { value: 'TRADE_SHOW', label: 'Feria Comercial' },
    { value: 'OTHER', label: 'Otro' }
  ];

  const userOptions = users.map(user => ({
    value: user.id,
    label: user.name
  }));

  // Determinar si el campo de responsable debe estar deshabilitado
  const isResponsibleDisabled = user?.role === 'sales_rep';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo Lead' : 'Editar Lead'}
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
            />

            <Input
              label="Teléfono"
              leftIcon={<Phone className="h-5 w-5 text-gray-400" />}
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />

            <Input
              label="Empresa"
              leftIcon={<Building className="h-5 w-5 text-gray-400" />}
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
            />

            <Input
              label="Cargo/Posición"
              value={formData.position}
              onChange={(e) => handleInputChange('position', e.target.value)}
            />
          </div>

          {/* Lead Details */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Detalles del Lead</h4>

            <Select
              label="Fuente"
              options={sourceOptions}
              value={formData.source}
              onChange={(value) => handleInputChange('source', value)}
            />

            <Input
              label="Segmento"
              value={formData.segment}
              onChange={(e) => handleInputChange('segment', e.target.value)}
              helperText="Ej: Corporativo, PyME, Individual"
            />

            <Input
              label="Valor Potencial (€)"
              type="number"
              leftIcon={<DollarSign className="h-5 w-5 text-gray-400" />}
              value={formData.potentialValue}
              onChange={(e) => handleInputChange('potentialValue', e.target.value)}
              error={errors.potentialValue}
              step="0.01"
              min="0"
            />

            <Select
              label="Responsable"
              options={[
                { value: '', label: 'Sin asignar', disabled: isResponsibleDisabled },
                ...userOptions
              ]}
              value={formData.responsibleId}
              onChange={(value) => handleInputChange('responsibleId', value)}
              disabled={isResponsibleDisabled}
              helperText={isResponsibleDisabled ? 'Los representantes de ventas solo pueden crear leads para sí mismos' : undefined}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <Input
            label="Etiquetas"
            value={formData.tags}
            onChange={(e) => handleInputChange('tags', e.target.value)}
            placeholder="Ej: Corporativo, Alto Valor, Tecnología (separadas por comas)"
            helperText="Separa las etiquetas con comas"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={4}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Información adicional sobre el lead..."
          />
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
            {mode === 'create' ? 'Crear Lead' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};