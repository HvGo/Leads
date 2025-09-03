import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, BarChart3, Users, UserCheck, Tag, TrendingUp, Phone, Shield, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { hasPermission, user } = useAuth();

  // Crear menú dinámico basado en roles
  const getMenuItems = () => {
    const baseItems = [
      {
        name: 'Leads',
        href: '/leads',
        icon: UserCheck,
        permission: 'leads.read',
      },
      {
        name: 'Interacciones',
        href: '/interactions',
        icon: Phone,
        permission: null,
      },
      {
        name: 'Usuarios',
        href: '/users',
        icon: Users,
        permission: null,
      },
    ];

    // Solo admin, super_admin y manager pueden ver Dashboard y Analytics
    if (user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'manager') {
      return [
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: BarChart3,
          permission: null,
        },
        {
          name: 'Roles',
          href: '/roles',
          icon: Shield,
          permission: 'users.manage_roles',
        },
        {
          name: 'Permisos',
          href: '/permissions',
          icon: Settings,
          permission: 'users.manage_roles',
        },
        ...baseItems,
        {
          name: 'Análisis',
          href: '/analytics',
          icon: TrendingUp,
          permission: 'analytics.read',
        },
      ];
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  const filteredMenuItems = menuItems.filter(item =>
    !item.permission || hasPermission(item.permission)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-semibold text-gray-900">Leads </span>
            </div>

            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-4 space-y-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              CRM Pro v1.0.0<br />
              Sistema de Gestión de Leads
            </div>
          </div>
        </div>
      </div>
    </>
  );
};