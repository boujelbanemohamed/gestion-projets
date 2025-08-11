import { apiService } from '../services/api'
import { supabaseApiService } from '../services/supabaseApi'
import { mockDataService } from '../services/mockDataService'

export const useApi = () => {
  // Évaluer les configurations à chaque appel (pas une seule fois)
  const useSupabaseLocal = localStorage.getItem('useSupabase') === 'true';
  const useSupabaseEnv = import.meta.env.VITE_USE_SUPABASE === 'true';
  const useMockDataLocal = localStorage.getItem('useMockData') === 'true';
  const useMockDataEnv = import.meta.env.VITE_USE_MOCK_DATA === 'true';

  console.log('🔍 Configuration API:', {
    useSupabaseLocal,
    useSupabaseEnv,
    useMockDataLocal,
    useMockDataEnv
  });

  // Priorité : Supabase (localStorage) > Supabase (env) > Mock Data > Backend local
  if (useSupabaseLocal || (useSupabaseEnv && !useMockDataLocal)) {
    console.log('🗄️ Utilisation de Supabase');
    return supabaseApiService;
  }

  if (useMockDataLocal || (useMockDataEnv && !useSupabaseLocal)) {
    console.log('🎭 Utilisation des données mockées');
    return mockDataService;
  }

  console.log('⚙️ Utilisation du backend local');
  return apiService;
}

// Fonction pour activer/désactiver les données mockées
export const toggleMockData = (enabled: boolean) => {
  localStorage.setItem('useMockData', enabled.toString())
  window.location.reload()
}

// Fonction pour vérifier si les données mockées sont actives
export const isMockDataEnabled = () => {
  const useMockDataLocal = localStorage.getItem('useMockData') === 'true';
  const useMockDataEnv = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const useSupabaseLocal = localStorage.getItem('useSupabase') === 'true';

  return (useMockDataLocal || useMockDataEnv) && !useSupabaseLocal;
}

export default useApi
