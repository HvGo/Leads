import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  roleDisplayName: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  canAccessLead: (leadResponsibleId?: string) => boolean;
  canAccessUser: (userId?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('Checking auth status...');
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found');
        return;
      }

      // Extraer userId del token
      const userId = token.replace('simple-token-', '');
      if (!userId) {
        console.log('Invalid token format');
        localStorage.removeItem('token');
        return;
      }

      const response = await apiService.get(`/auth/me/${userId}`);
      console.log('Auth check successful:', response.data);
      setUser(response.data.user);
    } catch (error) {
      console.log('Auth check failed, removing token');
      localStorage.removeItem('token');
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with:', { email, password }); // Debug log

      const response = await apiService.post('/auth/login', { email, password });

      console.log('Login response:', response.data); // Debug log

      const { user, token } = response.data;

      localStorage.setItem('token', token);
      apiService.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete apiService.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!permission) return true; // Si no requiere permiso específico, permitir acceso
    if (!user) return false;

    // Super admin tiene todos los permisos
    if (user.role === 'super_admin') return true;

    return user?.permissions?.includes(permission) || false;
  };

  const canAccessLead = (leadResponsibleId?: string): boolean => {
    if (!user) return false;

    // Super admin y admin pueden ver todos los leads
    if (user.role === 'super_admin' || user.role === 'admin' || user.role === 'manager') {
      return true;
    }

    // Sales rep solo puede ver sus leads asignados
    if (user.role === 'sales_rep') {
      return !leadResponsibleId || leadResponsibleId === user.id;
    }

    // Viewer puede ver todos pero no editar
    if (user.role === 'viewer') {
      return true;
    }

    return false;
  };

  const canAccessUser = (userId?: string): boolean => {
    if (!user) return false;

    // Super admin puede gestionar todos los usuarios
    if (user.role === 'super_admin') return true;

    // Admin puede gestionar usuarios excepto super admins
    if (user.role === 'admin') return true;

    // Otros roles solo pueden ver su propio perfil
    return userId === user.id;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      hasPermission,
      canAccessLead,
      canAccessUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};