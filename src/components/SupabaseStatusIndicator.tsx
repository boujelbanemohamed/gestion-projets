import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const SupabaseStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');
  const [backendStatus, setBackendStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');
  const [useSupabase, setUseSupabase] = useState(false);

  useEffect(() => {
    checkSupabaseStatus();
  }, []);

  const checkSupabaseStatus = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const useSupabaseEnv = import.meta.env.VITE_USE_SUPABASE === 'true';
      
      setUseSupabase(useSupabaseEnv);

      if (!useSupabaseEnv) {
        setStatus('disconnected');
        // Vérifier aussi le backend quand Supabase est désactivé
        try {
          setBackendStatus('loading');
          const apiBaseUrl = import.meta.env.VITE_API_URL;
          if (apiBaseUrl) {
            const healthUrl = `${apiBaseUrl.replace(/\/$/, '')}/health`;
            const res = await fetch(healthUrl);
            setBackendStatus(res.ok ? 'connected' : 'disconnected');
          } else {
            setBackendStatus('disconnected');
          }
        } catch (e) {
          setBackendStatus('disconnected');
        }
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
      if (backendStatus === 'loading') {
        return {
          icon: <Loader size={16} className="text-blue-500 animate-spin" />,
          text: 'Backend…',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700'
        };
      }
      if (backendStatus === 'connected') {
        return {
          icon: <CheckCircle size={16} className="text-green-500" />,
          text: 'Backend OK',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700'
        };
      }
      return {
        icon: <AlertCircle size={16} className="text-red-500" />,
        text: 'Backend KO',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700'
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
