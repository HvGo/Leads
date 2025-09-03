import React, { useState, useEffect } from 'react';
import { Users, UserCheck, TrendingUp, Phone, Calendar, AlertTriangle, ArrowRight, User, Activity, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { analyticsService, healthService } from '../services/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Badge } from '../components/ui/Badge';

interface DashboardStats {
  summary: {
    totalLeads: number;
    newLeads: number;
    totalInteractions: number;
    leadsConverted: number;
    conversionRate: number;
  };
  leadsByStatus: Array<{ status: string; count: number }>;
  interactionsByType: Array<{ type: string; count: number }>;
  topPerformers: Array<{ id: string; name: string; interactionCount: number }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    userName: string;
    leadName?: string;
    createdAt: string;
  }>;
}

const statusLabels: { [key: string]: string } = {
  'NEW': 'Nuevos',
  'CONTACTED': 'Contactados',
  'QUALIFIED': 'Calificados',
  'PROPOSAL': 'Propuesta',
  'NEGOTIATION': 'Negociación',
  'CLOSED_WON': 'Cerrados (Ganados)',
  'CLOSED_LOST': 'Cerrados (Perdidos)',
  'ON_HOLD': 'En Espera'
};

const statusColors: { [key: string]: string } = {
  'NEW': 'bg-blue-500',
  'CONTACTED': 'bg-yellow-500',
  'QUALIFIED': 'bg-green-500',
  'PROPOSAL': 'bg-purple-500',
  'NEGOTIATION': 'bg-orange-500',
  'CLOSED_WON': 'bg-green-600',
  'CLOSED_LOST': 'bg-red-500',
  'ON_HOLD': 'bg-gray-500'
};

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    loadDashboardStats();
    loadSystemHealth();
  }, [period]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await analyticsService.getDashboard(period);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemHealth = async () => {
    try {
      const health = await healthService.getStatus();
      setSystemHealth(health);
    } catch (error) {
      console.error('Error loading system health:', error);
      setSystemHealth({
        status: 'error',
        error: 'Unable to check system health'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Error al cargar las estadísticas del dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Resumen del rendimiento del sistema CRM</p>
        </div>

        <div className="flex items-center space-x-3">
          <label htmlFor="period" className="text-sm font-medium text-gray-700">
            Período:
          </label>
          <select
            id="period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="365">Último año</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900">{stats.summary.totalLeads}</p>
              <p className="text-sm text-green-600 font-medium">
                +{stats.summary.newLeads} nuevos
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Convertidos</p>
              <p className="text-3xl font-bold text-gray-900">{stats.summary.leadsConverted}</p>
              <p className="text-sm text-blue-600 font-medium">
                {stats.summary.conversionRate}% tasa
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Phone className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Interacciones</p>
              <p className="text-3xl font-bold text-gray-900">{stats.summary.totalInteractions}</p>
              <p className="text-sm text-purple-600 font-medium">
                En {period} días
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rendimiento</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round((stats.summary.totalInteractions / stats.summary.totalLeads) * 10) / 10}
              </p>
              <p className="text-sm text-orange-600 font-medium">
                Int. por lead
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Health Status */}
      {systemHealth && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Estado del Sistema
            </h3>
            <Badge variant={systemHealth.status === 'healthy' ? 'success' : systemHealth.status === 'error' ? 'error' : 'warning'}>
              {systemHealth.status === 'healthy' ? 'Saludable' :
                systemHealth.status === 'error' ? 'Error' : 'Degradado'}
            </Badge>
          </div>

          {systemHealth.data?.services && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(systemHealth.data.services).map(([serviceName, service]: [string, any]) => (
                <div key={serviceName} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    {serviceName === 'database' && <Database className="h-6 w-6" />}
                    {serviceName === 'api' && <Activity className="h-6 w-6" />}
                    {serviceName === 'frontend' && <User className="h-6 w-6" />}
                    {serviceName === 'filesystem' && <Calendar className="h-6 w-6" />}
                    {serviceName === 'environment' && <TrendingUp className="h-6 w-6" />}
                  </div>
                  <p className="text-sm font-medium text-gray-900 capitalize mb-1">
                    {serviceName === 'database' ? 'Base de Datos' :
                      serviceName === 'api' ? 'API' :
                        serviceName === 'frontend' ? 'Frontend' :
                          serviceName === 'filesystem' ? 'Archivos' :
                            serviceName === 'environment' ? 'Variables' : serviceName}
                  </p>
                  <Badge
                    variant={service.status === 'healthy' ? 'success' :
                      service.status === 'error' ? 'error' :
                        service.status === 'warning' ? 'warning' : 'info'}
                    size="sm"
                  >
                    {service.status === 'healthy' ? 'OK' :
                      service.status === 'error' ? 'Error' :
                        service.status === 'warning' ? 'Alerta' : 'Info'}
                  </Badge>
                  {service.details && (
                    <p className="text-xs text-gray-500 mt-1">
                      {service.details.users !== undefined && `${service.details.users} usuarios`}
                      {service.details.leads !== undefined && `, ${service.details.leads} leads`}
                      {service.details.port && `Puerto ${service.details.port}`}
                      {service.details.assetFiles && `${service.details.assetFiles} archivos`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {systemHealth.data?.summary && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Resumen:</strong> {systemHealth.data.summary.healthy}/{systemHealth.data.summary.total} servicios saludables
                ({systemHealth.data.summary.percentage}%)
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Navigation */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acceso Rápido</h3>
          <div className="space-y-3">
            <Link
              to="/users"
              className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Gestión de Usuarios</p>
                  <p className="text-sm text-gray-600">Administrar usuarios del sistema</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </Link>

            <Link
              to="/interactions"
              className="flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Historial de Interacciones</p>
                  <p className="text-sm text-gray-600">Ver todas las interacciones registradas</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </Link>

            <Link
              to="/leads"
              className="flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Gestión de Leads</p>
                  <p className="text-sm text-gray-600">Administrar y seguir leads</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
            </Link>

            <Link
              to="/analytics"
              className="flex items-center justify-between p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Análisis y Métricas</p>
                  <p className="text-sm text-gray-600">Dashboard de rendimiento</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Leads by Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads por Estado</h3>
          <div className="space-y-3">
            {stats.leadsByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${statusColors[item.status] || 'bg-gray-400'}`}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {statusLabels[item.status] || item.status}
                  </span>
                </div>
                <Badge variant="default">{item.count}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Interactions by Type */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Interacciones por Tipo</h3>
          <div className="space-y-3">
            {stats.interactionsByType.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {item.type.toLowerCase().replace('_', ' ')}
                </span>
                <Badge variant="info">{item.count}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
          <div className="space-y-4">
            {stats.topPerformers.map((performer, index) => (
              <div key={performer.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{performer.name}</p>
                    <p className="text-xs text-gray-500">{performer.interactionCount} interacciones</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.userName}</span>{' '}
                    {activity.action.toLowerCase().replace('_', ' ')}
                    {activity.leadName && (
                      <span className="text-blue-600"> {activity.leadName}</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.createdAt).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};