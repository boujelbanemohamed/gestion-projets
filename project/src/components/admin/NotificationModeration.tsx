import React, { useState } from 'react';
import { Check, X, Clock, Mail, Filter, Search, Users } from 'lucide-react';
import { AuthUser } from '../../types';

interface NotificationModerationProps {
  currentUser: AuthUser;
}

interface NotificationEmail {
  id: string;
  subject: string;
  recipient: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  type: 'project_update' | 'task_assignment' | 'deadline_reminder' | 'comment_notification' | 'member_added';
  projectName?: string;
  sender: string;
}

const NotificationModeration: React.FC<NotificationModerationProps> = () => {
  const [emails, setEmails] = useState<NotificationEmail[]>([
    {
      id: '1',
      subject: 'Mise à jour du projet - Site E-commerce',
      recipient: 'john.doe@example.com',
      content: 'Bonjour John, Le projet Site E-commerce a été mis à jour. Nouvelle tâche assignée : "Intégration paiement". Veuillez consulter le tableau de bord pour plus de détails.',
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 heures ago
      type: 'project_update',
      projectName: 'Site E-commerce',
      sender: 'system@projet.com'
    },
    {
      id: '2',
      subject: 'Nouvelle tâche assignée',
      recipient: 'jane.smith@example.com',
      content: 'Bonjour Jane, Une nouvelle tâche vous a été assignée : "Design de la page d\'accueil". Date limite : 15/12/2024. Connectez-vous pour voir les détails.',
      status: 'approved',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 heures ago
      type: 'task_assignment',
      projectName: 'Refonte site web',
      sender: 'manager@projet.com'
    },
    {
      id: '3',
      subject: 'Rappel : Échéance approche',
      recipient: 'mike.wilson@example.com',
      content: 'Bonjour Mike, La tâche "Tests d\'intégration" arrive à échéance dans 2 jours. Veuillez mettre à jour le statut si nécessaire.',
      status: 'rejected',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 heures ago
      type: 'deadline_reminder',
      projectName: 'Application mobile',
      sender: 'system@projet.com'
    },
    {
      id: '4',
      subject: 'Vous avez été ajouté(e) au projet - Application mobile',
      recipient: 'sarah.johnson@example.com',
      content: 'Bonjour Sarah, Vous avez été ajouté(e) au projet "Application mobile" en tant que développeur. Vous pouvez maintenant accéder au projet et voir toutes les tâches associées. Bienvenue dans l\'équipe !',
      status: 'pending',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 heure ago
      type: 'member_added',
      projectName: 'Application mobile',
      sender: 'admin@projet.com'
    },
    {
      id: '5',
      subject: 'Nouveau membre ajouté au projet - Site E-commerce',
      recipient: 'alex.martin@example.com',
      content: 'Bonjour Alex, Sarah Johnson a été ajoutée au projet "Site E-commerce" en tant que designer. Elle rejoindra l\'équipe dès aujourd\'hui.',
      status: 'approved',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 heures ago
      type: 'member_added',
      projectName: 'Site E-commerce',
      sender: 'project.manager@projet.com'
    }
  ]);

  const [selectedEmail, setSelectedEmail] = useState<NotificationEmail | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmails = emails.filter(email => {
    const matchesFilter = filter === 'all' || email.status === filter;
    const matchesSearch = email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.projectName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleApprove = (emailId: string) => {
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, status: 'approved' as const } : email
    ));
  };

  const handleReject = (emailId: string) => {
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, status: 'rejected' as const } : email
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">En attente</span>;
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Approuvé</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Rejeté</span>;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project_update':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'task_assignment':
        return <Mail className="h-4 w-4 text-green-500" />;
      case 'deadline_reminder':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'comment_notification':
        return <Mail className="h-4 w-4 text-purple-500" />;
      case 'member_added':
        return <Users className="h-4 w-4 text-indigo-500" />;
      default:
        return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Modération des notifications</h2>
        <p className="text-sm text-gray-600">
          Approuvez ou rejetez les emails de notifications avant leur envoi.
        </p>
      </div>

      {/* Filtres et recherche */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par sujet, destinataire ou projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
                         <select
               value={filter}
               onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
               className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvés</option>
              <option value="rejected">Rejetés</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des emails */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Emails ({filteredEmails.length})</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredEmails.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Aucun email trouvé
                </div>
              ) : (
                filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedEmail?.id === email.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {getTypeIcon(email.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {email.subject}
                          </h4>
                          {getStatusBadge(email.status)}
                        </div>
                        <p className="text-xs text-gray-500 mb-1">
                          À: {email.recipient}
                        </p>
                        {email.projectName && (
                          <p className="text-xs text-gray-500 mb-1">
                            Projet: {email.projectName}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {formatDate(email.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Détails de l'email */}
        <div className="lg:col-span-2">
          {selectedEmail ? (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Détails de l'email</h3>
                  {selectedEmail.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(selectedEmail.id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                      >
                        <Check size={14} />
                        <span>Approuver</span>
                      </button>
                      <button
                        onClick={() => handleReject(selectedEmail.id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        <X size={14} />
                        <span>Rejeter</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                  <p className="text-sm text-gray-900">{selectedEmail.subject}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destinataire</label>
                    <p className="text-sm text-gray-900">{selectedEmail.recipient}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expéditeur</label>
                    <p className="text-sm text-gray-900">{selectedEmail.sender}</p>
                  </div>
                </div>
                
                {selectedEmail.projectName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Projet</label>
                    <p className="text-sm text-gray-900">{selectedEmail.projectName}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de création</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedEmail.createdAt)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedEmail.content}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(selectedEmail.status)}
                    {selectedEmail.status === 'pending' && (
                      <span className="text-xs text-gray-500">En attente de modération</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun email sélectionné</h3>
              <p className="text-sm text-gray-500">
                Sélectionnez un email dans la liste pour voir ses détails
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModeration; 