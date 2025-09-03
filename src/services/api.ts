import axios from 'axios';

// Detectar automáticamente la URL del backend
const getApiBaseUrl = () => {
  // Si hay variable de entorno específica, usarla
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Si estamos en producción, construir URL basada en el dominio actual
  if (import.meta.env.PROD) {
    const currentDomain = window.location.hostname;
    const currentProtocol = window.location.protocol;
    const currentPort = window.location.port;

    // En producción, el backend está en el mismo dominio
    return `${currentProtocol}//${currentDomain}${currentPort ? ':' + currentPort : ''}`;
  }

  // En desarrollo, usar localhost
  return 'http://localhost:3001';
};

const API_BASE_URL = getApiBaseUrl();

export const apiService = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
apiService.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), `${API_BASE_URL}${config.url}`); // Debug log
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Response error:', `${API_BASE_URL}${error.config?.url}`, error.response?.status, error.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Lead services
export const leadService = {
  getAll: (params: any = {}) => apiService.get('/leads', { params }),
  getById: (id: string) => apiService.get(`/leads/${id}`),
  create: (data: any) => apiService.post('/leads', data),
  update: (id: string, data: any) => apiService.put(`/leads/${id}`, data),
  delete: (id: string) => apiService.delete(`/leads/${id}`),
  getPriorityList: () => apiService.get('/leads/priority/list'),
};

// Interaction services
export const interactionService = {
  create: (data: any) => apiService.post('/interactions', data),
  update: (id: string, data: any) => apiService.put(`/interactions/${id}`, data),
  delete: (id: string) => apiService.delete(`/interactions/${id}`),
  getAll: (params: any = {}) => apiService.get('/interactions', { params }),
};

// User services
export const userService = {
  getAll: () => apiService.get('/users'),
  getById: (id: string) => apiService.get(`/users/${id}`),
  create: (data: any) => apiService.post('/users', data),
  update: (id: string, data: any) => apiService.put(`/users/${id}`, data),
  delete: (id: string) => apiService.delete(`/users/${id}`),
};

// Tag services
export const tagService = {
  getAll: () => apiService.get('/tags'),
};

// Analytics services
export const analyticsService = {
  getDashboard: (period: string = '30') =>
    apiService.get(`/analytics/dashboard?period=${period}`),
};

// Health check service
export const healthService = {
  check: () => apiService.get('/health'),
  getStatus: async () => {
    try {
      const response = await apiService.get('/health');
      return {
        status: 'healthy',
        data: response.data
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.response?.data || error.message
      };
    }
  }
};