import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Calendar, 
  PieChart, 
  BarChart3,
  Download,
  Filter
} from 'lucide-react';
import { analyticsService } from '../services/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface AnalyticsData {
  summary: {
    totalLeads: number;
    newLeads: number;
    totalInteractions: number;
    leadsConverted: number;
    conversionRate: number;
  };
  leadsByStatus: Array<{ status: string; count: number }>;
  interactionsByType: Array<{ type: string; count: number }>;
  topPerformers: Array<{ 
    id: string; 
    name: string; 
    interactionCount: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    userName: string;
    leadName?: string;
    createdAt: string;
  }>;
}

interface LeadPerformance {
  leadsBySource: Array<{ source: string; count: number }>;
  conversionBySource: Array<{ source: string; converted: number }>;
  leadsByMonth: Array<{ month: string; count: number }>;
  potentialValueByStatus: Array<{ 
    status: string; 
    totalValue: number; 
    count: number; 
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

const sourceLabels: { [key: string]: string } = {
  'WEBSITE': 'Sitio Web',
  'REFERRAL': 'Referidos',
  'SOCIAL_MEDIA': 'Redes Sociales',
  'EMAIL_CAMPAIGN': 'Campañas Email',
  'PHONE_CALL': 'Llamadas',
  'TRADE_SHOW': 'Ferias',
  'OTHER': 'Otros'
};

const typeLabels: { [key: string]: string } = {
  'CALL': 'Llamadas',
  'EMAIL': 'Emails',
  'MEETING': 'Reuniones',
  'MESSAGE': 'Mensajes',
  'WHATSAPP': 'WhatsApp',
  'OTHER': 'Otros'
};

export const AnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [leadPerformance, setLeadPerformance] = useState<LeadPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [performancePeriod, setPerformancePeriod] = useState('90');

  useEffect(() => {
    loadAnalyticsData();
  }, [period]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await analyticsService.getDashboard(period);
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Análisis y Métricas</h1>
          <p className="text-gray-600 mt-1">Dashboard completo de rendimiento y estadísticas del CRM</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Reporte
          </Button>
          
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros Avanzados
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-3xl font-bold text-gray-900">{analyticsData.summary.totalLeads}</p>
                <p className="text-sm text-green-600 font-medium">
                  +{analyticsData.summary.newLeads} nuevos
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Convertidos</p>
                <p className="text-3xl font-bold text-gray-900">{analyticsData.summary.leadsConverted}</p>
                <p className="text-sm text-blue-600 font-medium">
                  {analyticsData.summary.conversionRate.toFixed(1)}% tasa
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Interacciones</p>
                <p className="text-3xl font-bold text-gray-900">{analyticsData.summary.totalInteractions}</p>
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
                <p className="text-sm font-medium text-gray-600">Avg. por Lead</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(analyticsData.summary.totalInteractions / analyticsData.summary.totalLeads || 0).toFixed(1)}
                </p>
                <p className="text-sm text-orange-600 font-medium">
                  Interacciones
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <BarChart3 className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Eficiencia</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analyticsData.summary.conversionRate > 15 ? 'Alta' :
                   analyticsData.summary.conversionRate > 10 ? 'Media' : 'Baja'}
                </p>
                <p className="text-sm text-yellow-600 font-medium">
                  Conversión
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Leads by Status */}
        {analyticsData && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Distribución por Estado</h3>
              <div className="flex items-center space-x-2">
                <PieChart className="h-5 w-5 text-gray-400" />
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="7">7 días</option>
                  <option value="30">30 días</option>
                  <option value="90">90 días</option>
                  <option value="365">1 año</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              {analyticsData.leadsByStatus.map((item) => {
                const percentage = analyticsData.summary.totalLeads > 0 
                  ? (item.count / analyticsData.summary.totalLeads * 100).toFixed(1)
                  : '0';
                
                return (
                  <div key={item.status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {statusLabels[item.status] || item.status}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">{percentage}%</span>
                        <Badge variant="default">
                          {item.count}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Interactions by Type */}
        {analyticsData && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Interacciones por Tipo</h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              {analyticsData.interactionsByType.map((item) => {
                const maxCount = Math.max(...analyticsData.interactionsByType.map(i => i.count));
                const percentage = maxCount > 0 ? (item.count / maxCount * 100) : 0;
                
                return (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-3 mr-3">
                        <div 
                          className="bg-green-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {typeLabels[item.type] || item.type}
                        </p>
                      </div>
                    </div>
                    <Badge variant="success" className="ml-3">
                      {item.count}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Lead Performance Section */}
      {leadPerformance && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Análisis de Rendimiento</h2>
            <select
              value={performancePeriod}
              onChange={(e) => setPerformancePeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
              <option value="180">Últimos 6 meses</option>
              <option value="365">Último año</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Leads by Source */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Leads por Fuente</h3>
              <div className="space-y-4">
                {leadPerformance.leadsBySource.map((item) => {
                  const conversionItem = leadPerformance.conversionBySource.find(c => c.source === item.source);
                  const conversionRate = item.count > 0 ? ((conversionItem?.converted || 0) / item.count * 100) : 0;
                  
                  return (
                    <div key={item.source} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {sourceLabels[item.source] || item.source}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.count} leads • {conversionRate.toFixed(1)}% conversión
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="info">{item.count}</Badge>
                        <p className="text-xs text-green-600 mt-1">
                          {conversionItem?.converted || 0} convertidos
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Potential Value by Status */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Valor Potencial por Estado</h3>
              <div className="space-y-4">
                {leadPerformance.potentialValueByStatus
                  .sort((a, b) => b.totalValue - a.totalValue)
                  .map((item) => (
                  <div key={item.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {statusLabels[item.status] || item.status}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.count} leads
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatCurrency(item.totalValue)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.count > 0 ? formatCurrency(item.totalValue / item.count) : '€0'} promedio
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Performers */}
      {analyticsData && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Top Performers del Equipo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {analyticsData.topPerformers.slice(0, 3).map((performer, index) => (
              <div key={performer.id} className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <div className="relative inline-block mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                  }`}>
                    {index + 1}
                  </div>
                  {index === 0 && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      👑
                    </div>
                  )}
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{performer.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{performer.interactionCount} interacciones</p>
                <Badge variant={index === 0 ? 'warning' : 'info'}>
                  {index === 0 ? '🏆 Líder' : `#${index + 1} Equipo`}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};