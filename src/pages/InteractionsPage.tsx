import React, { useState, useEffect } from 'react';
import { Phone, Calendar, User, Clock, Edit, Trash2, Plus } from 'lucide-react';
import { interactionService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { InteractionForm } from '../components/forms/InteractionForm';

interface Interaction {
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
  lead: {
    id: string;
    name: string;
    company?: string;
  };
}

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

const channelLabels: { [key: string]: string } = {
  'MOBILE': 'Móvil',
  'LANDLINE': 'Fijo',
  'WHATSAPP': 'WhatsApp',
  'EMAIL': 'Email',
  'IN_PERSON': 'Presencial',
  'VIDEO_CALL': 'Video llamada',
  'OTHER': 'Otro'
};

const resultColors: { [key: string]: 'default' | 'success' | 'warning' | 'error' | 'info' } = {
  'SUCCESSFUL': 'success',
  'MEETING_SCHEDULED': 'success',
  'INFORMATION_SENT': 'info',
  'CALLBACK_REQUESTED': 'warning',
  'NO_ANSWER': 'warning',
  'BUSY': 'warning',
  'NOT_INTERESTED': 'error',
  'OTHER': 'default'
};

export const InteractionsPage: React.FC = () => {
  const { user, canAccessLead } = useAuth();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);

  useEffect(() => {
    loadInteractions();
  }, []);

  const loadInteractions = async () => {
    try {
      setLoading(true);
      const response = await interactionService.getAll();

      // Filtrar interacciones según permisos del usuario
      let filteredInteractions = response.data.interactions || [];

      if (user?.role === 'sales_rep') {
        // Sales rep solo ve interacciones de sus leads asignados
        filteredInteractions = filteredInteractions.filter((interaction: Interaction) =>
          interaction.user.id === user.id
        );
      }

      setInteractions(filteredInteractions);

      // Calcular analytics
      const totalInteractions = filteredInteractions.length;
      const interactionsByType = filteredInteractions.reduce((acc: any, interaction: Interaction) => {
        const existing = acc.find((item: any) => item.type === interaction.type);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ type: interaction.type, count: 1 });
        }
        return acc;
      }, []);

      const totalDuration = filteredInteractions
        .filter((i: Interaction) => i.duration)
        .reduce((sum: number, i: Interaction) => sum + (i.duration || 0), 0);
      const interactionsWithDuration = filteredInteractions.filter((i: Interaction) => i.duration).length;
      const averageDuration = interactionsWithDuration > 0 ? Math.round(totalDuration / interactionsWithDuration) : 0;

      setAnalytics({
        totalInteractions,
        interactionsByType: interactionsByType.sort((a: any, b: any) => b.count - a.count),
        averageDuration
      });
    } catch (error) {
      console.error('Error loading interactions:', error);
      setInteractions([]);
      setAnalytics({
        totalInteractions: 0,
        interactionsByType: [],
        averageDuration: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInteraction = async (data: any) => {
    try {
      console.log('Creating interaction from interactions page:', data); // Debug log
      await interactionService.create(data);
      loadInteractions();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating interaction:', error);
      alert('Error al crear la interacción: ' + (error as any).response?.data?.error || (error as any).message);
    }
  };

  const handleEditInteraction = (interaction: Interaction) => {
    setSelectedInteraction(interaction);
    setShowEditModal(true);
  };

  const handleUpdateInteraction = async (data: any) => {
    if (!selectedInteraction) return;

    try {
      await interactionService.update(selectedInteraction.id, data);
      loadInteractions();
      setShowEditModal(false);
      setSelectedInteraction(null);
    } catch (error) {
      console.error('Error updating interaction:', error);
    }
  };

  const handleDeleteInteraction = async (interaction: Interaction) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta interacción?')) {
      try {
        await interactionService.delete(interaction.id);
        loadInteractions();
      } catch (error) {
        console.error('Error deleting interaction:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interacciones</h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'sales_rep'
              ? 'Historial de interacciones con tus leads asignados'
              : 'Historial completo de todas las interacciones con leads'
            }
          </p>
        </div>

        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Interacción
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Phone className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Interacciones</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalInteractions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <User className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Más Usada</p>
                <p className="text-lg font-bold text-gray-900">
                  {analytics.interactionsByType[0]?.type
                    ? typeLabels[analytics.interactionsByType[0].type]
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Duración Promedio</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.averageDuration} min</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Este Mes</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analytics.totalInteractions}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Últimas Interacciones</h2>
        </div>

        <div className="p-6">
          {interactions.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {user?.role === 'sales_rep'
                  ? 'No tienes interacciones registradas en tus leads'
                  : 'No hay interacciones para mostrar'
                }
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Las interacciones aparecerán aquí cuando se registren contactos con los leads
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {interactions.map((interaction) => (
                <div key={interaction.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge variant="info" size="sm">
                          {typeLabels[interaction.type]}
                        </Badge>
                        <Badge variant={resultColors[interaction.result]} size="sm">
                          {resultLabels[interaction.result]}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          vía {channelLabels[interaction.channel]}
                        </span>
                        {interaction.duration && (
                          <span className="text-sm text-gray-500">
                            • {interaction.duration} min
                          </span>
                        )}
                      </div>

                      <p className="font-medium text-gray-900 mb-1">
                        {interaction.lead.name}
                        {interaction.lead.company && (
                          <span className="text-gray-500"> - {interaction.lead.company}</span>
                        )}
                      </p>

                      <p className="text-sm text-gray-600 mb-2">
                        Atendido por: <span className="font-medium">{interaction.user.name}</span>
                      </p>

                      {interaction.notes && (
                        <p className="text-gray-900 text-sm bg-gray-50 p-2 rounded">
                          {interaction.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-start space-x-2 ml-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(interaction.createdAt).toLocaleDateString('es-ES')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(interaction.createdAt).toLocaleTimeString('es-ES')}
                        </p>
                      </div>

                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditInteraction(interaction)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteInteraction(interaction)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Interaction Modal */}
      <InteractionForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateInteraction}
        leadId=""
        leadName=""
        mode="create"
      />

      {/* Edit Interaction Modal */}
      {selectedInteraction && (
        <InteractionForm
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedInteraction(null);
          }}
          onSubmit={handleUpdateInteraction}
          leadId={selectedInteraction.lead.id}
          leadName={selectedInteraction.lead.name}
          initialData={selectedInteraction}
          mode="edit"
        />
      )}
    </div>
  );
};