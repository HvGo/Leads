import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { leadService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { LeadForm } from '../components/forms/LeadForm';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: string;
  source: string;
  potentialValue?: number;
  lastInteractionDate?: string;
  responsible?: {
    id: string;
    name: string;
  };
  tags: string[];
  _count: {
    interactions: number;
  };
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

const statusColors: { [key: string]: 'default' | 'success' | 'warning' | 'error' | 'info' } = {
  'NEW': 'info',
  'CONTACTED': 'warning',
  'QUALIFIED': 'success',
  'PROPOSAL': 'info',
  'NEGOTIATION': 'warning',
  'CLOSED_WON': 'success',
  'CLOSED_LOST': 'error',
  'ON_HOLD': 'default'
};

export const LeadsPage: React.FC = () => {
  const { hasPermission, canAccessLead, user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showPriorityList, setShowPriorityList] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  useEffect(() => {
    loadLeads();
  }, [page, statusFilter, sourceFilter, searchTerm]);

  const loadLeads = async () => {
    try {
      setLoading(true);

      if (showPriorityList) {
        const response = await leadService.getPriorityList();
        // Filtrar leads según permisos del usuario
        const filteredLeads = response.data.leads.filter((lead: Lead) =>
          canAccessLead(lead.responsible?.id)
        );
        setLeads(filteredLeads);
        setTotalPages(1);
      } else {
        const params = {
          page,
          limit: 20,
          status: statusFilter || undefined,
          source: sourceFilter || undefined,
          search: searchTerm || undefined,
          // Si es sales_rep, solo mostrar sus leads
          responsibleId: user?.role === 'sales_rep' ? user.id : undefined,
        };
        const response = await leadService.getAll(params);
        // Filtrar leads según permisos del usuario
        const filteredLeads = response.data.leads.filter((lead: Lead) =>
          canAccessLead(lead.responsible?.id)
        );
        setLeads(filteredLeads);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (data: any) => {
    try {
      // Si es sales_rep, asignar automáticamente el lead a sí mismo
      if (user?.role === 'sales_rep') {
        data.responsibleId = user.id;
      }
      await leadService.create(data);
      loadLeads(); // Recargar la lista
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating lead:', error);
    }
  };

  const handleEditLead = (lead: Lead) => {
    // Verificar si puede editar este lead
    if (!canAccessLead(lead.responsible?.id)) {
      alert('No tienes permisos para editar este lead');
      return;
    }
    setSelectedLead(lead);
    setShowEditModal(true);
  };

  const handleUpdateLead = async (data: any) => {
    if (!selectedLead) return;

    try {
      // Si es sales_rep, no permitir cambiar el responsable
      if (user?.role === 'sales_rep') {
        data.responsibleId = selectedLead.responsible?.id || user.id;
      }
      await leadService.update(selectedLead.id, data);
      loadLeads();
      setShowEditModal(false);
      setSelectedLead(null);
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const handleDeleteLead = (lead: Lead) => {
    // Verificar si puede eliminar este lead
    if (!canAccessLead(lead.responsible?.id) || !hasPermission('leads.delete')) {
      alert('No tienes permisos para eliminar este lead');
      return;
    }
    setLeadToDelete(lead);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteLead = async () => {
    if (!leadToDelete) return;

    try {
      await leadService.delete(leadToDelete.id);
      loadLeads();
      setShowDeleteConfirm(false);
      setLeadToDelete(null);
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'No especificado';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Función para verificar si puede mostrar botones de acción
  const canShowActions = (lead: Lead) => {
    return canAccessLead(lead.responsible?.id);
  };

  // Función para verificar si puede editar
  const canEdit = (lead: Lead) => {
    return canAccessLead(lead.responsible?.id) && hasPermission('leads.update');
  };

  // Función para verificar si puede eliminar
  const canDelete = (lead: Lead) => {
    return canAccessLead(lead.responsible?.id) && hasPermission('leads.delete');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Leads</h1>
          <p className="text-gray-600 mt-1">
            {showPriorityList ? 'Lista priorizada de leads' :
              user?.role === 'sales_rep' ? 'Administra tus leads asignados' :
                'Administra y monitorea todos los leads del sistema'}
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex space-x-3">
          {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'manager') && (
            <Button
              variant="outline"
              onClick={() => setShowPriorityList(!showPriorityList)}
            >
              {showPriorityList ? 'Vista Normal' : 'Vista Priorizada'}
            </Button>
          )}

          {hasPermission('leads.create') && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Lead
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {!showPriorityList && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar leads..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los estados</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las fuentes</option>
              <option value="WEBSITE">Sitio Web</option>
              <option value="REFERRAL">Referido</option>
              <option value="SOCIAL_MEDIA">Redes Sociales</option>
              <option value="EMAIL_CAMPAIGN">Campaña Email</option>
              <option value="PHONE_CALL">Llamada</option>
              <option value="TRADE_SHOW">Feria</option>
              <option value="OTHER">Otro</option>
            </select>

            {hasPermission('analytics.export') && (
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Leads List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {user?.role === 'sales_rep'
                ? 'No tienes leads asignados'
                : 'No se encontraron leads'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Potencial
                    </th>
                    {(user?.role !== 'sales_rep') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Responsable
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interacciones
                    </th>
                    {showPriorityList && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prioridad
                      </th>
                    )}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.map((lead: any) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                          {lead.company && (
                            <div className="text-sm text-gray-500">{lead.company}</div>
                          )}
                          {lead.tags && lead.tags.length > 0 && (
                            <div className="flex space-x-1 mt-1">
                              {lead.tags.map((tag: string, index: number) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                  style={{ backgroundColor: '#3B82F620', color: '#3B82F6' }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.email || 'No especificado'}</div>
                        <div className="text-sm text-gray-500">{lead.phone || 'No especificado'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={statusColors[lead.status]}>
                          {statusLabels[lead.status]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(lead.potentialValue)}
                      </td>
                      {(user?.role !== 'sales_rep') && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lead.responsible?.name || 'Sin asignar'}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="info">
                          {lead._count.interactions}
                        </Badge>
                      </td>
                      {showPriorityList && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={(lead as any).priorityScore > 200 ? 'error' : (lead as any).priorityScore > 150 ? 'warning' : 'default'}
                          >
                            {(lead as any).priorityScore}
                          </Badge>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {canShowActions(lead) && (
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/leads/${lead.id}`}
                              className="text-blue-600 hover:text-blue-900 inline-flex items-center px-2 py-1 rounded"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>

                            {canEdit(lead) && (
                              <button
                                onClick={() => handleEditLead(lead)}
                                className="text-gray-600 hover:text-gray-900 inline-flex items-center px-2 py-1 rounded"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}

                            {canDelete(lead) && (
                              <button
                                onClick={() => handleDeleteLead(lead)}
                                className="text-red-600 hover:text-red-900 inline-flex items-center px-2 py-1 rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!showPriorityList && totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Siguiente
                  </Button>
                </div>

                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Página <span className="font-medium">{page}</span> de{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Lead Modal */}
      <LeadForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateLead}
        mode="create"
      />

      {/* Edit Lead Modal */}
      <LeadForm
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedLead(null);
        }}
        onSubmit={handleUpdateLead}
        initialData={selectedLead}
        mode="edit"
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && leadToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteConfirm(false)} />

            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-red-100 rounded-full mr-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Eliminar Lead</h3>
                  <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                ¿Estás seguro de que deseas eliminar el lead <strong>{leadToDelete.name}</strong>?
                Todas las interacciones y datos asociados se perderán permanentemente.
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
                  onClick={confirmDeleteLead}
                >
                  Eliminar Lead
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};