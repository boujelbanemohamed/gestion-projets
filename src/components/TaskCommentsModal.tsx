import React, { useState } from 'react';
import { X, MessageCircle, Send, Calendar, Trash2, Upload, File, Download, Paperclip } from 'lucide-react';
import { Task, Comment, User as UserType, CommentAttachment } from '../types';

interface TaskCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onAddComment: (taskId: string, comment: Omit<Comment, 'id' | 'created_at'>) => void;
  onDeleteComment: (taskId: string, commentId: string) => void;

  availableUsers: UserType[];
}

const TaskCommentsModal: React.FC<TaskCommentsModalProps> = ({
  isOpen,
  onClose,
  task,
  onAddComment,
  onDeleteComment,

  availableUsers
}) => {
  const [newComment, setNewComment] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  const [commentAttachments, setCommentAttachments] = useState<File[]>([]);

  // For demo purposes, use the first available user as default
  React.useEffect(() => {
    if (availableUsers.length > 0 && !selectedAuthor) {
      setSelectedAuthor(availableUsers[0].id);
    }
  }, [availableUsers, selectedAuthor]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting comment:', { newComment, selectedAuthor, taskId: task.id });
    
    if (!newComment.trim() || !selectedAuthor) {
      console.log('Comment submission cancelled: empty comment or no author');
      return;
    }

    const author = availableUsers.find(user => user.id === selectedAuthor);
    if (!author) {
      console.log('Author not found');
      return;
    }

    console.log('Found author:', author);

    // Convert files to CommentAttachment objects (in a real app, you'd upload to a server)
    const attachments: CommentAttachment[] = commentAttachments.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      nom: file.name,
      taille: file.size,
      type: file.type,
      url: URL.createObjectURL(file), // In a real app, this would be the server URL
      uploaded_at: new Date()
    }));

    const commentData = {
      contenu: newComment.trim(),
      auteur: author,
      task_id: task.id,
      attachments: attachments.length > 0 ? attachments : undefined
    };

    console.log('Calling onAddComment with:', commentData);
    onAddComment(task.id, commentData);

    setNewComment('');
    setCommentAttachments([]);
  };

  const handleDeleteComment = (commentId: string, authorName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ce commentaire de ${authorName} ?`)) {
      onDeleteComment(task.id, commentId);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 5 * 1024 * 1024; // 5MB for comments
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`Le fichier "${file.name}" est trop volumineux (max 5MB pour les commentaires)`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        alert(`Le type de fichier "${file.name}" n'est pas autorisé`);
        return false;
      }
      return true;
    });

    setCommentAttachments(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setCommentAttachments(prev => prev.filter((_, i) => i !== index));
  };

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

  const downloadAttachment = (attachment: CommentAttachment) => {
    // In a real app, this would download from the server
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.nom;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  const comments = task.commentaires || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageCircle className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Commentaires - {task.nom}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {comments.length} commentaire{comments.length > 1 ? 's' : ''}
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

        <div className="p-6 space-y-6">
          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun commentaire
                </h3>
                <p className="text-gray-500">
                  Soyez le premier à ajouter un commentaire sur cette tâche.
                </p>
              </div>
            ) : (
              comments
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 group hover:shadow-sm transition-all duration-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {comment.auteur.prenom.charAt(0)}{comment.auteur.nom.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-semibold text-gray-900">
                              {comment.auteur.prenom} {comment.auteur.nom}
                            </h4>
                            {comment.auteur.fonction && (
                              <span className="text-xs text-gray-500">
                                • {comment.auteur.fonction}
                              </span>
                            )}
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Calendar size={12} />
                              <span>{comment.created_at.toLocaleDateString('fr-FR')} à {comment.created_at.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteComment(comment.id, `${comment.auteur.prenom} ${comment.auteur.nom}`)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                            title="Supprimer le commentaire"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        
                        {/* Comment Attachments - Now displayed before content */}
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className="mb-3 space-y-2">
                            <div className="flex items-center space-x-2">
                              <Paperclip size={14} className="text-gray-400" />
                              <span className="text-xs font-medium text-gray-700">
                                {comment.attachments.length} pièce{comment.attachments.length > 1 ? 's' : ''} jointe{comment.attachments.length > 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {comment.attachments.map((attachment) => (
                                <div
                                  key={attachment.id}
                                  className="flex items-center space-x-2 bg-white rounded-lg p-2 border border-gray-200 hover:shadow-sm transition-shadow cursor-pointer"
                                  onClick={() => downloadAttachment(attachment)}
                                >
                                  <span className="text-sm">{getFileIcon(attachment.type)}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 truncate">
                                      {attachment.nom}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(attachment.taille)}
                                    </p>
                                  </div>
                                  <Download size={14} className="text-gray-400 hover:text-blue-600" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {comment.contenu}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* Add Comment Form */}
          <div className="border-t bg-gray-50 p-6">
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                  Commenter en tant que
                </label>
                <select
                  id="author"
                  value={selectedAuthor}
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.prenom} {user.nom} {user.fonction ? `(${user.fonction})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload for Comments - Optimized display */}
              <div className="space-y-3">
                {/* Compact Upload Area */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Pièces jointes
                  </label>
                  <span className="text-xs text-gray-500">
                    {commentAttachments.length} fichier{commentAttachments.length > 1 ? 's' : ''}
                  </span>
                </div>
                
                {/* Upload Button */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-blue-400 transition-colors bg-gray-50">
                  <input
                    type="file"
                    id="commentFileUpload"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                  />
                  <label
                    htmlFor="commentFileUpload"
                    className="cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <Upload className="text-blue-600" size={16} />
                    <span className="text-sm font-medium text-gray-700">
                      Ajouter des fichiers
                    </span>
                    <span className="text-xs text-gray-500">
                      (max 5MB)
                    </span>
                  </label>
                </div>

                {/* Uploaded Files List - Compact */}
                {commentAttachments.length > 0 && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                      {commentAttachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-white rounded-md p-2 border border-gray-200 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <span className="text-sm">{getFileIcon(file.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-2"
                            title="Supprimer le fichier"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                  Votre commentaire
                </label>
                <div className="relative">
                  <textarea
                    id="comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none pr-12"
                    placeholder="Ajoutez votre commentaire..."
                    required
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || !selectedAuthor}
                    className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    title="Envoyer le commentaire"
                  >
                    <Send size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {newComment.length}/500 caractères
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCommentsModal;