import React, { useState } from 'react';
import { X, Paperclip, Download, Calendar, User, Building, FileText, MessageCircle, Search, Filter } from 'lucide-react';
import { Project } from '../types';

interface ProjectAttachmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

interface AttachmentWithSource {
  id: string;
  nom: string;
  taille: number;
  type: string;
  url: string;
  uploaded_at: Date;
  uploaded_by?: { id: string; nom: string; prenom: string };
  source: 'project' | 'task' | 'comment';
  sourceName: string;
  sourceId: string;
}

const ProjectAttachmentsModal: React.FC<ProjectAttachmentsModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'project' | 'task' | 'comment'>('all');
  const [filterFileType, setFilterFileType] = useState<'all' | 'pdf' | 'word' | 'excel' | 'image' | 'text'>('all');

  if (!isOpen) return null;

  // Collect all attachments from project, tasks, and comments
  const getAllAttachments = (): AttachmentWithSource[] => {
    const attachments: AttachmentWithSource[] = [];

    // Project attachments
    if (project.attachments) {
      project.attachments.forEach(attachment => {
        attachments.push({
          ...attachment,
          source: 'project',
          sourceName: `Projet: ${project.nom}`,
          sourceId: project.id
        });
      });
    }

    // Task attachments
    project.taches.forEach(task => {
      if (task.attachments) {
        task.attachments.forEach(attachment => {
          attachments.push({
            ...attachment,
            source: 'task',
            sourceName: `Tâche: ${task.nom}`,
            sourceId: task.id
          });
        });
      }

      // Comment attachments
      if (task.commentaires) {
        task.commentaires.forEach(comment => {
          if (comment.attachments) {
            comment.attachments.forEach(attachment => {
              attachments.push({
                ...attachment,
                uploaded_by: comment.auteur,
                source: 'comment',
                sourceName: `Commentaire sur: ${task.nom}`,
                sourceId: comment.id
              });
            });
          }
        });
      }
    });

    return attachments;
  };

  const allAttachments = getAllAttachments();

  // Filter attachments
  const filteredAttachments = allAttachments.filter(attachment => {
    const matchesSearch = attachment.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         attachment.sourceName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSource = filterType === 'all' || attachment.source === filterType;
    
    const matchesFileType = filterFileType === 'all' || 
      (filterFileType === 'pdf' && attachment.type.includes('pdf')) ||
      (filterFileType === 'word' && (attachment.type.includes('word') || attachment.type.includes('document'))) ||
      (filterFileType === 'excel' && (attachment.type.includes('excel') || attachment.type.includes('sheet'))) ||
      (filterFileType === 'image' && attachment.type.includes('image')) ||
      (filterFileType === 'text' && attachment.type.includes('text'));

    return matchesSearch && matchesSource && matchesFileType;
  });

  // Sort by upload date (most recent first)
  const sortedAttachments = filteredAttachments.sort((a, b) => 
    new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    return '📎';
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'project': return <Building size={16} className="text-blue-600" />;
      case 'task': return <FileText size={16} className="text-green-600" />;
      case 'comment': return <MessageCircle size={16} className="text-orange-600" />;
      default: return <Paperclip size={16} className="text-gray-600" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'project': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'task': return 'bg-green-50 border-green-200 text-green-800';
      case 'comment': return 'bg-orange-50 border-orange-200 text-orange-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const downloadAttachment = (attachment: AttachmentWithSource) => {
    // In a real app, this would download from the server
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.nom;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStats = () => {
    const projectCount = allAttachments.filter(a => a.source === 'project').length;
    const taskCount = allAttachments.filter(a => a.source === 'task').length;
    const commentCount = allAttachments.filter(a => a.source === 'comment').length;
    const totalSize = allAttachments.reduce((sum, a) => sum + a.taille, 0);

    return { projectCount, taskCount, commentCount, totalSize };
  };

  const stats = getStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Paperclip className="text-orange-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Toutes les pièces jointes du projet
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {allAttachments.length} fichier{allAttachments.length > 1 ? 's' : ''} • {formatFileSize(stats.totalSize)} au total
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stats Overview */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center space-x-3">
                <Building className="text-blue-600" size={20} />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Projet</p>
                  <p className="text-lg font-bold text-blue-900">{stats.projectCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center space-x-3">
                <FileText className="text-green-600" size={20} />
                <div>
                  <p className="text-sm text-green-800 font-medium">Tâches</p>
                  <p className="text-lg font-bold text-green-900">{stats.taskCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center space-x-3">
                <MessageCircle className="text-orange-600" size={20} />
                <div>
                  <p className="text-sm text-orange-800 font-medium">Commentaires</p>
                  <p className="text-lg font-bold text-orange-900">{stats.commentCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center space-x-3">
                <Paperclip className="text-purple-600" size={20} />
                <div>
                  <p className="text-sm text-purple-800 font-medium">Taille totale</p>
                  <p className="text-lg font-bold text-purple-900">{formatFileSize(stats.totalSize)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher un fichier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Source Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-400" size={20} />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'project' | 'task' | 'comment')}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Toutes les sources</option>
                <option value="project">Projet uniquement</option>
                <option value="task">Tâches uniquement</option>
                <option value="comment">Commentaires uniquement</option>
              </select>
            </div>

            {/* File Type Filter */}
            <div>
              <select
                value={filterFileType}
                onChange={(e) => setFilterFileType(e.target.value as 'all' | 'pdf' | 'word' | 'excel' | 'image' | 'text')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous les types</option>
                <option value="pdf">PDF</option>
                <option value="word">Word</option>
                <option value="excel">Excel</option>
                <option value="image">Images</option>
                <option value="text">Texte</option>
              </select>
            </div>
          </div>
        </div>

        {/* Attachments List */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-400px)]">
          {sortedAttachments.length === 0 ? (
            <div className="text-center py-12">
              <Paperclip className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {allAttachments.length === 0 ? 'Aucune pièce jointe' : 'Aucun fichier trouvé'}
              </h3>
              <p className="text-gray-500">
                {allAttachments.length === 0 
                  ? 'Ce projet ne contient aucune pièce jointe.'
                  : 'Aucun fichier ne correspond à vos critères de recherche.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedAttachments.map((attachment) => (
                <div
                  key={`${attachment.source}-${attachment.sourceId}-${attachment.id}`}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
                  onClick={() => downloadAttachment(attachment)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{getFileIcon(attachment.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {attachment.nom}
                      </h4>
                      
                      {/* Source */}
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium mt-2 border ${getSourceColor(attachment.source)}`}>
                        {getSourceIcon(attachment.source)}
                        <span className="truncate max-w-32">{attachment.sourceName}</span>
                      </div>

                      {/* File info */}
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{formatFileSize(attachment.taille)}</span>
                          <span>•</span>
                          <div className="flex items-center space-x-1">
                            <Calendar size={12} />
                            <span>{attachment.uploaded_at.toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                        
                        {attachment.uploaded_by && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <User size={12} />
                            <span>par {attachment.uploaded_by.prenom} {attachment.uploaded_by.nom}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Download size={16} className="text-gray-400 hover:text-blue-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {filteredAttachments.length} fichier{filteredAttachments.length > 1 ? 's' : ''} affiché{filteredAttachments.length > 1 ? 's' : ''} 
              {filteredAttachments.length !== allAttachments.length && ` sur ${allAttachments.length} au total`}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectAttachmentsModal;