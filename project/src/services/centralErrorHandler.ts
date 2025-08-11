export enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
  context?: string;
}

export class CentralErrorHandler {
  private static errors: AppError[] = [];
  
  static handle(error: any, context?: string): AppError {
    const appError = this.createAppError(error, context);
    this.logError(appError);
    return appError;
  }
  
  private static createAppError(error: any, context?: string): AppError {
    let type = ErrorType.UNKNOWN;
    let message = 'Une erreur inattendue s\'est produite';
    
    // Classification des erreurs
    if (error.message?.includes('auth') || error.message?.includes('login') || error.message?.includes('Invalid login credentials')) {
      type = ErrorType.AUTHENTICATION;
      message = 'Erreur d\'authentification - Vérifiez vos identifiants';
    } else if (error.message?.includes('permission') || error.message?.includes('unauthorized') || error.message?.includes('RLS')) {
      type = ErrorType.AUTHORIZATION;
      message = 'Accès non autorisé - Permissions insuffisantes';
    } else if (error.message?.includes('validation') || error.message?.includes('invalid') || error.message?.includes('violates check constraint')) {
      type = ErrorType.VALIDATION;
      message = 'Données invalides - Vérifiez les champs requis';
    } else if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
      type = ErrorType.NETWORK;
      message = 'Erreur de connexion - Vérifiez votre connexion internet';
    } else if (error.message?.includes('database') || error.message?.includes('supabase') || error.message?.includes('PostgreSQL')) {
      type = ErrorType.DATABASE;
      message = 'Erreur de base de données - Réessayez plus tard';
    } else if (error.message) {
      message = error.message;
    }
    
    return {
      type,
      message,
      code: error.code,
      details: error.details || error,
      timestamp: new Date(),
      context
    };
  }
  
  static logError(appError: AppError): void {
    this.errors.push(appError);
    
    // Garder seulement les 100 dernières erreurs
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
    
    console.error('🚨 Central Error Handler:', {
      type: appError.type,
      message: appError.message,
      context: appError.context,
      timestamp: appError.timestamp.toISOString()
    });
    
    // En production, envoyer vers un service de logging
    if (import.meta.env.PROD) {
      this.sendToLoggingService(appError);
    }
  }
  
  private static sendToLoggingService(error: AppError): void {
    // Implémenter l'envoi vers Sentry, LogRocket, etc.
    try {
      // fetch('/api/logs', { 
      //   method: 'POST', 
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(error) 
      // });
    } catch (e) {
      console.error('Failed to send error to logging service:', e);
    }
  }
  
  static getRecentErrors(): AppError[] {
    return [...this.errors].reverse();
  }
  
  static clearErrors(): void {
    this.errors = [];
  }
  
  // Méthodes utilitaires pour les types d'erreurs courants
  static createAuthError(message: string, context?: string): AppError {
    return this.handle(new Error(`auth: ${message}`), context);
  }
  
  static createValidationError(message: string, details?: any, context?: string): AppError {
    const error = new Error(`validation: ${message}`);
    (error as any).details = details;
    return this.handle(error, context);
  }
  
  static createNetworkError(message: string, context?: string): AppError {
    return this.handle(new Error(`network: ${message}`), context);
  }
  
  // Méthode pour afficher les erreurs à l'utilisateur
  static getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.AUTHENTICATION:
        return 'Problème de connexion. Vérifiez vos identifiants.';
      case ErrorType.AUTHORIZATION:
        return 'Vous n\'avez pas les permissions nécessaires.';
      case ErrorType.VALIDATION:
        return 'Veuillez vérifier les informations saisies.';
      case ErrorType.NETWORK:
        return 'Problème de connexion. Vérifiez votre internet.';
      case ErrorType.DATABASE:
        return 'Problème technique. Réessayez dans quelques instants.';
      default:
        return error.message || 'Une erreur inattendue s\'est produite.';
    }
  }
  
  // Méthode pour les statistiques d'erreurs
  static getErrorStats(): { [key in ErrorType]: number } {
    const stats = {
      [ErrorType.AUTHENTICATION]: 0,
      [ErrorType.AUTHORIZATION]: 0,
      [ErrorType.VALIDATION]: 0,
      [ErrorType.NETWORK]: 0,
      [ErrorType.DATABASE]: 0,
      [ErrorType.UNKNOWN]: 0
    };
    
    this.errors.forEach(error => {
      stats[error.type]++;
    });
    
    return stats;
  }
}

// Export par défaut pour faciliter l'import
export default CentralErrorHandler;
