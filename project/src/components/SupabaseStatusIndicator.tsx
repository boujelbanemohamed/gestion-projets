import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const SupabaseStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');
  const [useSupabase, setUseSupabase] = useState(false);

  useEffect(() => {
    checkSupabaseStatus();

    // Écouter les changements de localStorage
    const handleStorageChange = () => {
      console.log('🔄 Changement localStorage détecté - Mise à jour statut');
      checkSupabaseStatus();
    };

    window.addEventListener('storage', handleStorageChange);

    // Vérifier périodiquement les changements (pour les changements dans la même fenêtre)
    const interval = setInterval(() => {
      const currentSupabaseState = localStorage.getItem('useSupabase') === 'true';
      if (currentSupabaseState !== useSupabase) {
        console.log('🔄 Changement configuration détecté');
        checkSupabaseStatus();
      }
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [useSupabase]);

  const checkSupabaseStatus = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Vérifier d'abord localStorage, puis les variables d'environnement
      const useSupabaseLocal = localStorage.getItem('useSupabase') === 'true';
      const useSupabaseEnv = import.meta.env.VITE_USE_SUPABASE === 'true';
      const shouldUseSupabase = useSupabaseLocal || useSupabaseEnv;

      console.log('🔍 Vérification statut Supabase:', {
        localStorage: useSupabaseLocal,
        environment: useSupabaseEnv,
        final: shouldUseSupabase
      });

      setUseSupabase(shouldUseSupabase);

      if (!shouldUseSupabase) {
        setStatus('disconnected');
        return;
      }

      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'https://your-project.supabase.co' || 
          supabaseKey === 'your-anon-key') {
        setStatus('disconnected');
        return;
      }

      // Test simple de connectivité
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (response.ok || response.status === 401) {
        // 401 est normal car on n'a pas de token utilisateur
        setStatus('connected');
      } else {
        setStatus('disconnected');
      }
    } catch (error) {
      console.error('Erreur test Supabase:', error);
      setStatus('disconnected');
    }
  };

  const getStatusInfo = () => {
    if (!useSupabase) {
      return {
        icon: <Database size={16} className="text-gray-500" />,
        text: 'Mode Local',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700'
      };
    }

    switch (status) {
      case 'loading':
        return {
          icon: <Loader size={16} className="text-blue-500 animate-spin" />,
          text: 'Vérification...',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700'
        };
      case 'connected':
        return {
          icon: <CheckCircle size={16} className="text-green-500" />,
          text: 'Supabase OK',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700'
        };
      case 'disconnected':
        return {
          icon: <AlertCircle size={16} className="text-red-500" />,
          text: 'Supabase KO',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div 
      className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${statusInfo.bgColor} ${statusInfo.textColor} cursor-pointer`}
      onClick={checkSupabaseStatus}
      title="Cliquez pour vérifier la connexion"
    >
      {statusInfo.icon}
      <span className="text-sm font-medium">{statusInfo.text}</span>
    </div>
  );
};

export default SupabaseStatusIndicator;
