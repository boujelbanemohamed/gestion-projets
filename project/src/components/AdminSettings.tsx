import React, { useState } from 'react';
import { ArrowLeft, Mail, Shield, Bell, Settings } from 'lucide-react';
import { AuthUser } from '../types';
import SMTPConfiguration from './admin/SMTPConfiguration';
import NotificationModeration from './admin/NotificationModeration';
import NotificationManagement from './admin/NotificationManagement';
import BudgetCategoriesManagement from './admin/BudgetCategoriesManagement';

interface AdminSettingsProps {
  currentUser: AuthUser;
  onBack: () => void;
}

type AdminTab = 'smtp' | 'moderation' | 'management' | 'budget_categories';

const AdminSettings: React.FC<AdminSettingsProps> = ({ currentUser, onBack }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('smtp');

  const tabs = [
    {
      id: 'smtp' as AdminTab,
      label: 'Configuration SMTP',
      icon: Mail,
      description: 'Gérer les paramètres d\'envoi d\'emails'
    },
    {
      id: 'moderation' as AdminTab,
      label: 'Modération des notifications',
      icon: Shield,
      description: 'Modérer les emails de notifications'
    },
    {
      id: 'management' as AdminTab,
      label: 'Gestion des notifications',
      icon: Bell,
      description: 'Gérer les notifications par projet et utilisateur'
    },
    {
      id: 'budget_categories' as AdminTab,
      label: 'Rubriques budgétaires',
      icon: Settings,
      description: 'Gérer les rubriques budgétaires'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'smtp':
        return <SMTPConfiguration currentUser={currentUser} />;
      case 'moderation':
        return <NotificationModeration currentUser={currentUser} />;
      case 'management':
        return <NotificationManagement currentUser={currentUser} />;
      case 'budget_categories':
        return <BudgetCategoriesManagement currentUser={currentUser} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Settings className="text-white" size={16} />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Paramètres d'administration</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      isActive
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings; 