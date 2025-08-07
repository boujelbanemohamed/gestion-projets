import { apiService } from '../services/api'
import { supabaseApiService } from '../services/supabaseApi'
import { mockDataService } from '../services/mockDataService'

// Détermine quel service API utiliser
const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true'
const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true' || localStorage.getItem('useMockData') === 'true'

export const useApi = () => {
  // Priorité : Mock Data > Supabase > Backend local
  if (useMockData) {
    console.log('🎭 Utilisation des données mockées')
    return mockDataService
  }

  if (useSupabase) {
    console.log('🗄️ Utilisation de Supabase')
    return supabaseApiService
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
