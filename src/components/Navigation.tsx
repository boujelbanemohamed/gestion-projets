import React, { useState } from 'react';
import { Home, Users, Building, TrendingUp, User, ChevronDown, LogOut, Settings, Bell } from 'lucide-react';
import { AuthUser } from '../types';
import { PermissionService } from '../utils/permissions';
import NotificationsPanel from './NotificationsPanel';
import SupabaseStatusIndicator from './SupabaseStatusIndicator';

interface NavigationProps {
  currentUser: AuthUser;
  currentView: string;
  onNavigate: (view: 'dashboard' | 'members' | 'departments' | 'performance' | 'closed-projects' | 'admin-settings') => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  unreadNotificationsCount?: number;
}

const Navigation: React.FC<NavigationProps> = ({
  currentUser,
  currentView,
  onNavigate,
  onOpenProfile,
  onLogout,
  unreadNotificationsCount = 0
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Super Admin</span>;
      case 'ADMIN':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Admin</span>;
      case 'USER':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Utilisateur</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{role}</span>;
    }
  };

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: Home,
      show: PermissionService.canAccessPage(currentUser, 'dashboard')
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: TrendingUp,
      show: PermissionService.canAccessPage(currentUser, 'performance')
    },
    {
      id: 'members',
      label: 'Paramètres Membres',
      icon: Users,
      show: PermissionService.canAccessPage(currentUser, 'members')
    },
    {
      id: 'departments',
      label: 'Paramètres Département',
      icon: Building,
      show: PermissionService.canAccessPage(currentUser, 'departments')
    },
    {
      id: 'admin-settings',
      label: 'Paramètres d\'administration',
      icon: Settings,
      show: PermissionService.canAccessPage(currentUser, 'admin-settings')
    }
  ].filter(item => item.show);

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PM</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Gestion de Projets</h1>
            </div>

            {/* Navigation Items */}
            <div className="hidden md:flex space-x-1">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = currentView === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id as 'dashboard' | 'members' | 'departments' | 'performance' | 'closed-projects' | 'admin-settings')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Supabase Status */}
            <SupabaseStatusIndicator />

            {/* Notifications Bell */}
            <button
              onClick={() => setIsNotificationsPanelOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
              title="Notifications"
            >
              <Bell size={20} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>
            
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {currentUser.prenom.charAt(0)}{currentUser.nom.charAt(0)}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {currentUser.prenom} {currentUser.nom}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getRoleBadge(currentUser.role)}
                  </div>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {isUserMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {currentUser.prenom.charAt(0)}{currentUser.nom.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {currentUser.prenom} {currentUser.nom}
                          </div>
                          <div className="text-xs text-gray-500">
                            {currentUser.email}
                          </div>
                          <div className="mt-1">
                            {getRoleBadge(currentUser.role)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          onOpenProfile();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <User size={16} />
                        <span>Mon profil</span>
                      </button>
                      
                      <div className="border-t border-gray-100 my-1" />
                      
                      <button
                        onClick={() => {
                          onLogout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <LogOut size={16} />
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200 py-2">
          <div className="flex space-x-1 overflow-x-auto">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id as 'dashboard' | 'members' | 'departments' | 'performance' | 'closed-projects' | 'admin-settings')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent size={14} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={isNotificationsPanelOpen}
        onClose={() => setIsNotificationsPanelOpen(false)}
        currentUser={currentUser}
      />
    </nav>
  );
};

export default Navigation;