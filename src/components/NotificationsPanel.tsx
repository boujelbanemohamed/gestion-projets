import React, { useState, useEffect } from 'react';
import { X, Bell, Check, Clock, AlertTriangle, Calendar, ExternalLink } from 'lucide-react';
import { AuthUser } from '../types';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
  link?: string;
  created_at: Date;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  isOpen,
  onClose
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock notifications for demo
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // In a real app, this would fetch from the API
      setTimeout(() => {
        const mockNotifications: Notification[] = [
          {
            id: '1',
            title: 'Alerte : Projet Refonte Site Web arrive à échéance',
            message: 'Le projet Refonte Site Web se termine dans 3 jours, le 15/03/2024. Veuillez prendre les mesures nécessaires.',
            read: false,
            type: 'deadline_approaching',
            link: '#',
            created_at: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
          },
          {
            id: '2',
            title: 'Alerte : Projet Migration Base de Données en retard',
            message: 'Le projet Migration Base de Données a dépassé sa date d\'échéance de 2 jours. La date de fin était le 13/03/2024. Veuillez prendre les mesures nécessaires.',
            read: false,
            type: 'deadline_overdue',
            link: '#',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
          },
          {
            id: '3',
            title: 'Nouvelle tâche assignée',
            message: 'Vous avez été assigné à la tâche "Développement Frontend" dans le projet "Refonte Site Web".',
            read: true,
            type: 'task_assigned',
            link: '#',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
          }
        ];
        setNotifications(mockNotifications);
        setLoading(false);
      }, 500);
    }
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    // In a real app, this would call the API
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    // In a real app, this would call the API
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deadline_approaching':
        return <Clock size={16} className="text-orange-600" />;
      case 'deadline_overdue':
        return <AlertTriangle size={16} className="text-red-600" />;
      case 'task_assigned':
        return <Calendar size={16} className="text-blue-600" />;
      default:
        return <Bell size={16} className="text-gray-600" />;
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('fr-FR');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-xl z-50 flex flex-col">
      <div className="flex justify-between items-center p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bell className="text-blue-600" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-sm text-blue-600">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b">
        <p className="text-sm text-gray-600">
          {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
        </p>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Bell className="text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune notification
            </h3>
            <p className="text-gray-500">
              Vous n'avez aucune notification pour le moment.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 hover:bg-gray-50 transition-colors ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      {notification.link && (
                        <a 
                          href={notification.link} 
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                        >
                          <span>Voir le projet</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                        >
                          <Check size={12} />
                          <span>Marquer comme lu</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;