import React, { useEffect, useState } from 'react';

interface LoadingBarProps {
  isLoading: boolean;
  progress?: number;
  message?: string;
  showMessage?: boolean;
}

const LoadingBar: React.FC<LoadingBarProps> = ({ 
  isLoading, 
  progress = 0, 
  message = "Chargement en cours...",
  showMessage = true 
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      // Animation progressive de la barre
      const interval = setInterval(() => {
        setDisplayProgress(prev => {
          if (prev >= progress) {
            clearInterval(interval);
            return progress;
          }
          return Math.min(prev + 2, progress);
        });
      }, 50);

      return () => clearInterval(interval);
    } else {
      // Compléter rapidement quand le chargement est fini
      setDisplayProgress(100);
      setTimeout(() => setDisplayProgress(0), 500);
    }
  }, [isLoading, progress]);

  if (!isLoading && displayProgress === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Barre de progression */}
      <div className="h-1 bg-gray-200">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${displayProgress}%` }}
        />
      </div>
      
      {/* Message de chargement */}
      {showMessage && isLoading && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-2">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600 font-medium">{message}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant de chargement pour le contenu principal
export const ContentLoader: React.FC<{ message?: string }> = ({ 
  message = "Chargement des données..." 
}) => {
  return (
    <div className="flex items-center justify-center min-h-64 bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">{message}</p>
        <p className="text-sm text-gray-500 mt-2">Veuillez patienter...</p>
      </div>
    </div>
  );
};

// Composant de skeleton pour les cartes de projet
export const ProjectCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-6 w-16 bg-gray-200 rounded"></div>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <div className="h-8 w-16 bg-gray-200 rounded"></div>
          <div className="h-8 w-16 bg-gray-200 rounded"></div>
        </div>
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

// Hook pour gérer l'état de chargement avec progression
export const useLoadingProgress = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  const startLoading = (initialMessage = 'Chargement en cours...') => {
    setIsLoading(true);
    setProgress(0);
    setMessage(initialMessage);
  };

  const updateProgress = (newProgress: number, newMessage?: string) => {
    setProgress(Math.min(Math.max(newProgress, 0), 100));
    if (newMessage) {
      setMessage(newMessage);
    }
  };

  const finishLoading = () => {
    setProgress(100);
    setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
    }, 300);
  };

  return {
    isLoading,
    progress,
    message,
    startLoading,
    updateProgress,
    finishLoading
  };
};

export default LoadingBar;
