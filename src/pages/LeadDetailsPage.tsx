import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  Building,
  User,
  Calendar,
  DollarSign,
  Plus,
  Edit
} from 'lucide-react';
import { leadService, interactionService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { InteractionForm } from '../components/forms/InteractionForm';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  status: string;
  source: string;
  segment?: string;
  potentialValue?: number;
  notes?: string;
  lastInteractionDate?: string;
  createdAt: string;
  responsible?: {
    id: string;
    name: string;
    email: string;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
      color: string;
    };
  }>;
  interactions: Array<{
    id: string;
    type: string;
    channel: string;
    result: string;
    duration?: number;
    notes?: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
    };
  }>;
}

const statusLabels: { [key: string]: string } = {
  'NEW': 'Nuevo',
  'CONTACTED': 'Contactado',
  'QUALIFIED': 'Calificado',
  'PROPOSAL': 'Propuesta',
  'NEGOTIATION': 'Negociación',
  'CLOSED_WON': 'Ganado',
  'CLOSED_LOST': 'Perdido',
  'ON_HOLD': 'En Espera'
};

const typeLabels: { [key: string]: string } = {
  'CALL': 'Llamada',
  'EMAIL': 'Email',
  'MEETING': 'Reunión',
  'MESSAGE': 'Mensaje',
  'WHATSAPP': 'WhatsApp',
  'OTHER': 'Otro'
};

const resultLabels: { [key: string]: string } = {
  'SUCCESSFUL': 'Exitoso',
  'NO_ANSWER': 'Sin respuesta',
  'BUSY': 'Ocupado',
  'CALLBACK_REQUESTED': 'Solicita callback',
  'NOT_INTERESTED': 'No interesado',
  'MEETING_SCHEDULED': 'Reunión programada',
  'INFORMATION_SENT': 'Información enviada',
  'OTHER': 'Otro'
};

export const LeadDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canAccessLead, hasPermission } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInteractionForm, setShowInteractionForm] = useState(false);

  useEffect(() => {
    if (id) {
      loadLead(id);
    }
  }, [id]);

  const loadLead = async (leadId: string) => {
    try {
      setLoading(true);
      const response = await leadService.getById(leadId);
      setLead(response.data.lead);
    } catch (error) {
      console.error('Error loading lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInteraction = async (data: any) => {
    try {
      console.log('Creating interaction from lead details:', data); // Debug log
      await interactionService.create(data);
      // Recargar el lead para mostrar la nueva interacción
      if (id) {
        await loadLead(id);
      }
      setShowInteractionForm(false);
    } catch (error) {
      console.error('Error creating interaction:', error);
      alert('Error al crear la interacción: ' + (error as any).response?.data?.error || (error as any).message);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'No especificado';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Verificar si puede crear interacciones para este lead
  const canCreateInteraction = () => {
    if (!lead) return false;
    return canAccessLead(lead.responsible?.id) && hasPermission('interactions.create');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Lead no encontrado</p>
        <Button onClick={() => navigate('/leads')} className="mt-4">
          Volver a Leads
        </Button>
      </div>
    );
  }

  // Verificar si puede acceder a este lead
  if (!canAccessLead(lead.responsible?.id)) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No tienes permisos para ver este lead</p>
        <Button onClick={() => navigate('/leads')} className="mt-4">
          Volver a Leads
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/leads')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">{lead.name}</h1>
            <p className="text-gray-600">{lead.company || 'Sin empresa'}</p>
          </div>
        </div>

        <div className="flex space-x-3">
          {canAccessLead(lead.responsible?.id) && hasPermission('leads.update') && (
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          {canCreateInteraction() && (
            <Button onClick={() => setShowInteractionForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Interacción
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Información del Lead</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Nombre completo</p>
                    <p className="font-medium text-gray-900">{lead.name}</p>
                  </div>
                </div>

                {lead.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{lead.email}</p>
                    </div>
                  </div>
                )}

                {lead.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="font-medium text-gray-900">{lead.phone}</p>
                    </div>
                  </div>
                )}

                {lead.company && (
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Empresa</p>
                      <p className="font-medium text-gray-900">{lead.company}</p>
                      {lead.position && (
                        <p className="text-sm text-gray-600">{lead.position}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <Badge variant="info" size="md" className="mt-1">
                    {statusLabels[lead.status]}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Fuente</p>
                  <p className="font-medium text-gray-900 mt-1">{lead.source}</p>
                </div>

                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Valor potencial</p>
                    <p className="font-medium text-gray-900">{formatCurrency(lead.potentialValue)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Último contacto</p>
                    <p className="font-medium text-gray-900">
                      {lead.lastInteractionDate
                        ? new Date(lead.lastInteractionDate).toLocaleDateString('es-ES')
                        : 'Sin contacto'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {lead.tags.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-2">Etiquetas</p>
                <div className="flex flex-wrap gap-2">
                  {lead.tags.map((tagItem) => (
                    <span
                      key={tagItem.tag.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: tagItem.tag.color + '20',
                        color: tagItem.tag.color
                      }}
                    >
                      {tagItem.tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {lead.notes && (
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-2">Notas</p>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{lead.notes}</p>
              </div>
            )}
          </div>

          {/* Interactions History */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Historial de Interacciones ({lead.interactions.length})
              </h2>
              {canCreateInteraction() && (
                <Button size="sm" onClick={() => setShowInteractionForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              )}
            </div>

            {lead.interactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay interacciones registradas</p>
                {canCreateInteraction() && (
                  <Button
                    className="mt-4"
                    onClick={() => setShowInteractionForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Interacción
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {lead.interactions.map((interaction) => (
                  <div key={interaction.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge variant="info" size="sm">
                            {typeLabels[interaction.type]}
                          </Badge>
                          <Badge variant="default" size="sm">
                            {resultLabels[interaction.result]}
                          </Badge>
                          {interaction.duration && (
                            <span className="text-sm text-gray-500">
                              {interaction.duration} min
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">{interaction.user.name}</span> vía {interaction.channel}
                        </p>

                        {interaction.notes && (
                          <p className="text-gray-900 text-sm">{interaction.notes}</p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(interaction.createdAt).toLocaleDateString('es-ES')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(interaction.createdAt).toLocaleTimeString('es-ES')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Responsible */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Responsable</h3>
            {lead.responsible ? (
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{lead.responsible.name}</p>
                  <p className="text-sm text-gray-500">{lead.responsible.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Sin asignar</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total interacciones:</span>
                <span className="font-medium">{lead.interactions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Creado:</span>
                <span className="font-medium">
                  {new Date(lead.createdAt).toLocaleDateString('es-ES')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Segmento:</span>
                <span className="font-medium">{lead.segment || 'No definido'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interaction Form Modal */}
      {lead && (
        <InteractionForm
          isOpen={showInteractionForm}
          onClose={() => setShowInteractionForm(false)}
          onSubmit={handleCreateInteraction}
          leadId={lead.id}
          leadName={lead.name}
        />
      )}
    </div>
  );
};