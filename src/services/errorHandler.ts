// Service de gestion d'erreurs amélioré pour toutes les APIs
export class APIErrorHandler {
  static handleSupabaseError(error: any, context: string = '') {
    console.error(`❌ Supabase Error [${context}]:`, error);
    
    // Erreurs d'authentification
    if (error.message?.includes('Invalid login credentials')) {
      return 'Identifiants de connexion invalides';
    }
    
    if (error.message?.includes('Email not confirmed')) {
      return 'Email non confirmé. Vérifiez votre boîte mail.';
    }
    
    // Erreurs de permissions
    if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
      return 'Accès refusé. Permissions insuffisantes.';
    }
    
    // Erreurs de réseau
    if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
      return 'Erreur de connexion. Vérifiez votre connexion internet.';
    }
    
    // Erreurs de validation
    if (error.message?.includes('violates check constraint')) {
      return 'Données invalides. Vérifiez les champs requis.';
    }
    
    if (error.message?.includes('duplicate key value')) {
      return 'Cette entrée existe déjà.';
    }
    
    // Erreur générique
    return error.message || 'Une erreur inattendue s\'est produite';
  }
  
  static handleBackendError(error: any, context: string = '') {
    console.error(`❌ Backend Error [${context}]:`, error);
    
    if (error.message?.includes('ECONNREFUSED')) {
      return 'Serveur backend non accessible. Utilisation du mode Supabase.';
    }
    
    if (error.message?.includes('timeout')) {
      return 'Délai d\'attente dépassé. Réessayez.';
    }
    
    return error.message || 'Erreur du serveur backend';
  }
  
  static handleGenericError(error: any, context: string = '') {
    console.error(`❌ Generic Error [${context}]:`, error);
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    
    return error.message || 'Une erreur inattendue s\'est produite';
  }
  
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string = '',
    errorHandler: 'supabase' | 'backend' | 'generic' = 'generic'
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      let handledError: string;
      
      switch (errorHandler) {
        case 'supabase':
          handledError = this.handleSupabaseError(error, context);
          break;
        case 'backend':
          handledError = this.handleBackendError(error, context);
          break;
        default:
          handledError = this.handleGenericError(error, context);
      }
      
      throw new Error(handledError);
    }
  }
}

// Service de retry automatique
export class APIRetryService {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Ne pas retry sur certaines erreurs
        if (error instanceof Error) {
          if (error.message.includes('Identifiants') || 
              error.message.includes('permission denied') ||
              error.message.includes('duplicate key')) {
            throw error;
          }
        }
        
        if (attempt === maxRetries) {
          break;
        }
        
        console.warn(`⚠️ Tentative ${attempt}/${maxRetries} échouée, retry dans ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Backoff exponentiel
      }
    }
    
    throw lastError!;
  }
}

// Service de fallback automatique
export class APIFallbackService {
  static async withFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    context: string = ''
  ): Promise<T> {
    try {
      console.log(`📡 Tentative primaire [${context}]...`);
      return await primaryOperation();
    } catch (primaryError) {
      console.warn(`⚠️ Opération primaire échouée [${context}], fallback...`);
      console.warn('Erreur primaire:', primaryError);
      
      try {
        const result = await fallbackOperation();
        console.log(`✅ Fallback réussi [${context}]`);
        return result;
      } catch (fallbackError) {
        console.error(`❌ Fallback échoué [${context}]`);
        console.error('Erreur fallback:', fallbackError);
        
        // Retourner l'erreur la plus informative
        throw primaryError;
      }
    }
  }
}

// Service de validation des APIs
export class APIValidationService {
  static async validateEndpoint(url: string, options: RequestInit = {}): Promise<boolean> {
    try {
      const response = await fetch(url, {
        ...options,
        method: options.method || 'GET'
      });
      
      return response.ok || response.status === 401 || response.status === 403;
    } catch (error) {
      return false;
    }
  }
  
  static async validateSupabaseConnection(): Promise<{
    connected: boolean;
    services: {
      rest: boolean;
      auth: boolean;
      storage: boolean;
    }
  }> {
    const baseUrl = 'https://obdadipsbbrlwetkuyui.supabase.co';
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGFkaXBzYmJybHdldGt1eXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODgxMjMsImV4cCI6MjA3MDA2NDEyM30.jracnTOp7Y0QBTbt7qjY4076aBqh3pq7DR-rU_U33fo';
    
    const headers = {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`
    };
    
    const services = {
      rest: await this.validateEndpoint(`${baseUrl}/rest/v1/`, { headers }),
      auth: await this.validateEndpoint(`${baseUrl}/auth/v1/settings`, { headers }),
      storage: await this.validateEndpoint(`${baseUrl}/storage/v1/object`, { headers })
    };
    
    const connected = services.rest && services.auth;
    
    return { connected, services };
  }
  
  static async validateBackendConnection(): Promise<boolean> {
    const base = (import.meta.env.VITE_API_URL || 'https://gestion-projets-tdes.onrender.com/api').replace(/\/$/, '');
    return await this.validateEndpoint(`${base}/health`);
  }
}

// Export par défaut
export default {
  ErrorHandler: APIErrorHandler,
  RetryService: APIRetryService,
  FallbackService: APIFallbackService,
  ValidationService: APIValidationService
};
