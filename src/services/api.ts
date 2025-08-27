import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

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
    console.log('API Request:', config.method?.toUpperCase(), config.url); // Debug log
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
    console.error('API Response error:', error.response?.status, error.response?.data || error.message);
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