import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { Phone, Clock, MessageSquare, Calendar } from 'lucide-react';

interface InteractionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  leadId: string;
  leadName: string;
  initialData?: any;
  mode?: 'create' | 'edit';
}

export const InteractionForm: React.FC<InteractionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  leadId,
  leadName,
  initialData,
  mode = 'create'
}) => {
  const [formData, setFormData] = useState({
    type: 'CALL',
    channel: 'MOBILE',
    phoneUsed: '',
    result: 'SUCCESSFUL',
    duration: '',
    notes: '',
    scheduledAt: '',
    completedAt: new Date().toISOString().slice(0, 16)
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      if (initialData && mode === 'edit') {
        setFormData({
          type: initialData.type || 'CALL',
          channel: initialData.channel || 'MOBILE',
          phoneUsed: initialData.phone_used || '',
          result: initialData.result || 'SUCCESSFUL',
          duration: initialData.duration?.toString() || '',
          notes: initialData.notes || '',
          scheduledAt: initialData.scheduled_at ? new Date(initialData.scheduled_at).toISOString().slice(0, 16) : '',
          completedAt: initialData.completed_at ? new Date(initialData.completed_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
        });
      } else {
        setFormData({
          type: 'CALL',
          channel: 'MOBILE',
          phoneUsed: '',
          result: 'SUCCESSFUL',
          duration: '',
          notes: '',
          scheduledAt: '',
          completedAt: new Date().toISOString().slice(0, 16)
        });
      }
      // Limpiar errores al abrir el modal
      setErrors({});
    }
  }, [isOpen, initialData, mode]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error específico cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Validar tipo de interacción (obligatorio)
    if (!formData.type) {
      newErrors.type = 'El tipo de interacción es requerido';
    }

    // Validar canal (obligatorio)
    if (!formData.channel) {
      newErrors.channel = 'El canal es requerido';
    }

    // Validar resultado (obligatorio)
    if (!formData.result) {
      newErrors.result = 'El resultado es requerido';
    }

    // Validar fecha de realización (obligatorio)
    if (!formData.completedAt) {
      newErrors.completedAt = 'La fecha de realización es requerida';
    }

    // Validar duración si se proporciona
    if (formData.duration && (isNaN(Number(formData.duration)) || Number(formData.duration) < 0)) {
      newErrors.duration = 'La duración debe ser un número válido';
    }

    // Validar que la fecha programada no sea anterior a la fecha de realización
    if (formData.scheduledAt && formData.completedAt) {
      const scheduledDate = new Date(formData.scheduledAt);
      const completedDate = new Date(formData.completedAt);
      if (scheduledDate < completedDate) {
        newErrors.scheduledAt = 'La fecha programada no puede ser anterior a la fecha de realización';
      }
    }

    // Validar leadId para modo creación
    if (mode === 'create' && !leadId) {
      newErrors.leadId = 'Debe seleccionar un lead para crear la interacción';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Submitting interaction form with data:', formData); // Debug log
    console.log('Lead ID:', leadId); // Debug log

    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        leadId: leadId,
        duration: formData.duration ? parseInt(formData.duration) : null
      };

      console.log('Final submit data:', submitData); // Debug log

      await onSubmit(submitData);
      onClose();

      // Reset form only if creating
      if (mode === 'create') {
        setFormData({
          type: 'CALL',
          channel: 'MOBILE',
          phoneUsed: '',
          result: 'SUCCESSFUL',
          duration: '',
          notes: '',
          scheduledAt: '',
          completedAt: new Date().toISOString().slice(0, 16)
        });
        setErrors({});
      }
    } catch (error) {
      console.error('Error submitting interaction:', error);
      // Mostrar error más específico
      const errorMessage = (error as any).response?.data?.error || (error as any).message || 'Error desconocido';
      alert('Error al ' + (mode === 'create' ? 'crear' : 'actualizar') + ' la interacción: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    { value: 'CALL', label: 'Llamada' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'MEETING', label: 'Reunión' },
    { value: 'MESSAGE', label: 'Mensaje' },
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'OTHER', label: 'Otro' }
  ];

  const channelOptions = [
    { value: 'MOBILE', label: 'Móvil' },
    { value: 'LANDLINE', label: 'Fijo' },
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'IN_PERSON', label: 'Presencial' },
    { value: 'VIDEO_CALL', label: 'Video llamada' },
    { value: 'OTHER', label: 'Otro' }
  ];

  const resultOptions = [
    { value: 'SUCCESSFUL', label: 'Exitoso' },
    { value: 'NO_ANSWER', label: 'Sin respuesta' },
    { value: 'BUSY', label: 'Ocupado' },
    { value: 'CALLBACK_REQUESTED', label: 'Solicita callback' },
    { value: 'NOT_INTERESTED', label: 'No interesado' },
    { value: 'MEETING_SCHEDULED', label: 'Reunión programada' },
    { value: 'INFORMATION_SENT', label: 'Información enviada' },
    { value: 'OTHER', label: 'Otro' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? `Nueva Interacción${leadName ? ` - ${leadName}` : ''}` : `Editar Interacción - ${leadName}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mostrar error general si no hay lead seleccionado */}
        {errors.leadId && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{errors.leadId}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo de Interacción"
            options={typeOptions}
            value={formData.type}
            onChange={(value) => handleInputChange('type', value)}
            error={errors.name}
            required
          />

          <Select
            label="Canal"
            options={channelOptions}
            value={formData.channel}
            onChange={(value) => handleInputChange('channel', value)}
            error={errors.name}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Teléfono Utilizado"
            leftIcon={<Phone className="h-5 w-5 text-gray-400" />}
            value={formData.phoneUsed}
            onChange={(e) => handleInputChange('phoneUsed', e.target.value)}
            placeholder="Opcional"
          />

          <Input
            label="Duración (minutos)"
            type="number"
            leftIcon={<Clock className="h-5 w-5 text-gray-400" />}
            value={formData.duration}
            onChange={(e) => handleInputChange('duration', e.target.value)}
            error={errors.duration}
            min="0"
            placeholder="Opcional"
          />
        </div>

        <Select
          label="Resultado"
          options={resultOptions}
          value={formData.result}
          onChange={(value) => handleInputChange('result', value)}
          error={errors.result}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha de Realización"
            type="datetime-local"
            leftIcon={<Calendar className="h-5 w-5 text-gray-400" />}
            value={formData.completedAt}
            onChange={(e) => handleInputChange('completedAt', e.target.value)}
            error={errors.completedAt}
            required={true}
          />

          <Input
            label="Programado Para (Opcional)"
            type="datetime-local"
            leftIcon={<Calendar className="h-5 w-5 text-gray-400" />}
            value={formData.scheduledAt}
            onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
            error={errors.scheduledAt}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas de la Interacción
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={4}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Describe los detalles de la interacción, puntos clave discutidos, próximos pasos, etc."
          />
        </div>

        {/* Mostrar resumen de errores si hay múltiples */}
        {Object.keys(errors).length > 1 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-800 mb-2">Por favor, corrige los siguientes errores:</p>
            <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </div>
        )}
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
            disabled={loading}
          >
            {mode === 'create' ? 'Registrar Interacción' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};