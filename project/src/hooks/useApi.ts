import { apiService } from '../services/api'
import { supabaseApiService } from '../services/supabaseApi'
import { mockDataService } from '../services/mockDataService'

// Détermine quel service API utiliser
const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true' || localStorage.getItem('useSupabase') === 'true'
const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true' && localStorage.getItem('useSupabase') !== 'true'

export const useApi = () => {
  // Priorité : Supabase (si activé) > Mock Data > Backend local
  if (useSupabase && localStorage.getItem('useSupabase') === 'true') {
    console.log('🗄️ Utilisation de Supabase (forcé)')
    return supabaseApiService
  }

  if (useMockData && localStorage.getItem('useMockData') !== 'false') {
    console.log('🎭 Utilisation des données mockées')
    return mockDataService
  }

  console.log('⚙️ Utilisation du backend local')
  return apiService
}

// Fonction pour activer/désactiver les données mockées
export const toggleMockData = (enabled: boolean) => {
  localStorage.setItem('useMockData', enabled.toString())
  window.location.reload()
}

// Fonction pour vérifier si les données mockées sont actives
export const isMockDataEnabled = () => {
  return useMockData
}

export default useApi
