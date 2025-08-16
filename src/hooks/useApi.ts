import { apiService } from '../services/api'
import { supabaseApiService } from '../services/supabaseApi'
import { hybridApiService } from '../services/hybridApi'
import { mockDataService } from '../services/mockDataService'

// Détermine quel service API utiliser
// 1) En production: jamais de mock
// 2) Si VITE_USE_SUPABASE === 'true' on utilise un service hybride (Supabase -> fallback Backend)
const isProd = import.meta.env.PROD
const envUseSupabase = import.meta.env.VITE_USE_SUPABASE === 'true'
const envUseMock = import.meta.env.VITE_USE_MOCK_DATA === 'true'
const localMock = typeof window !== 'undefined' && localStorage.getItem('useMockData') === 'true'
const useMockData = isProd ? false : (envUseMock || localMock)
// En production, on autorise Supabase via un service hybride
const useSupabase = !useMockData && envUseSupabase

export const useApi = () => {
  // Priorité : Mock Data > Supabase > Backend (Render)
  if (useMockData) {
    console.log('🎭 Utilisation des données mockées')
    return mockDataService
  }

  if (useSupabase) {
    console.log('🗄️ Utilisation du mode Supabase DIRECT (pas hybride)')
    // Utiliser Supabase directement pour éviter les appels backend
    return supabaseApiService
  }

  console.log('⚙️ Utilisation du backend (Render)')
  return apiService
}

// Fonction pour activer/désactiver les données mockées
export const toggleMockData = (enabled: boolean) => {
  if (import.meta.env.PROD && enabled) {
    // En production, on ne permet pas d'activer le mock
    console.warn('Le mode mock est désactivé en production')
    return
  }
  localStorage.setItem('useMockData', enabled.toString())
  window.location.reload()
}

// Fonction pour vérifier si les données mockées sont actives
export const isMockDataEnabled = () => {
  return useMockData
}

export default useApi
console.log('env', import.meta.env.VITE_USE_SUPABASE, import.meta.env.VITE_API_URL);