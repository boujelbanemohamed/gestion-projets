import { apiService } from './api'
import { supabaseApiService } from './supabaseApi'

// Service hybride: utilise Supabase quand une méthode existe,
// sinon bascule automatiquement sur le backend Render.
// Cela permet d'activer VITE_USE_SUPABASE=true sans casser les écrans
// dont l'implémentation Supabase n'est pas encore complète.

type AnyService = Record<string, any>

function createHybridService(primary: AnyService, fallback: AnyService): AnyService {
	return new Proxy({}, {
		get(_target, prop: string, _receiver) {
			const primaryValue = (primary as AnyService)[prop]
			if (typeof primaryValue === 'function') {
				return (...args: unknown[]) => primaryValue.apply(primary, args)
			}
			if (primaryValue !== undefined) {
				return primaryValue
			}

			const fallbackValue = (fallback as AnyService)[prop]
			if (typeof fallbackValue === 'function') {
				return (...args: unknown[]) => fallbackValue.apply(fallback, args)
			}
			return fallbackValue
		}
	})
}

export const hybridApiService = createHybridService(supabaseApiService as AnyService, apiService as AnyService)


