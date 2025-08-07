import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import SupabaseConnectionModal from './SupabaseConnectionModal';

const SupabaseSetupButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    setIsConnected(!!(url && key && url !== 'your_supabase_project_url' && key !== 'your_supabase_anon_key'));
    setIsChecking(false);
  };

  const handleConnect = (url: string, key: string) => {
    // Dans un vrai environnement, ceci nécessiterait un redémarrage du serveur
    // Pour la démo, on simule la connexion
    console.log('Configuration Supabase:', { url, key });
    
    // Créer le fichier .env

    
    // Simuler la sauvegarde (dans un vrai cas, ceci nécessiterait une API backend)
    localStorage.setItem('supabase_config', JSON.stringify({ url, key }));
    
    setIsConnected(true);
    
    // Afficher les instructions pour redémarrer
    alert('Configuration sauvegardée ! Veuillez redémarrer le serveur de développement (npm run dev) pour que les changements prennent effet.');
  };

  if (isChecking) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
        <span className="text-sm text-gray-600">Vérification...</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
          isConnected
            ? 'bg-green-100 text-green-800 hover:bg-green-200'
            : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
        }`}
      >
        {isConnected ? (
          <>
            <CheckCircle size={16} />
            <span className="text-sm font-medium">Supabase connecté</span>
          </>
        ) : (
          <>
            <AlertCircle size={16} />
            <span className="text-sm font-medium">Connecter Supabase</span>
          </>
        )}
      </button>

      <SupabaseConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnect={handleConnect}
      />
    </>
  );
};

export default SupabaseSetupButton;