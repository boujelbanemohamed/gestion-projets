import { supabase } from '../lib/supabase';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  error_type?: string;
  user_id?: string;
  session_id?: string;
  url?: string;
  user_agent?: string;
  ip_address?: string;
  stack_trace?: string;
  additional_data?: any;
}

class LoggingService {
  private static instance: LoggingService;
  private sessionId: string;
  private userId?: string;
  private isEnabled: boolean = true;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandler();
  }

  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  private setupGlobalErrorHandler(): void {
    // Capturer les erreurs JavaScript non gérées
    window.addEventListener('error', (event) => {
      this.error('Erreur JavaScript non gérée', 'GLOBAL_ERROR', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Capturer les promesses rejetées non gérées
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Promise rejetée non gérée', 'UNHANDLED_REJECTION', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }

  private async writeLog(entry: LogEntry): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const logData = {
        level: entry.level,
        message: entry.message,
        context: entry.context,
        error_type: entry.error_type,
        user_id: entry.user_id || this.userId,
        session_id: this.sessionId,
        url: window.location.href,
        user_agent: navigator.userAgent,
        stack_trace: entry.stack_trace,
        additional_data: entry.additional_data ? JSON.stringify(entry.additional_data) : null
      };

      // Écrire en base de données
      const { error } = await supabase
        .from('logs')
        .insert([logData]);

      if (error) {
        console.error('❌ Erreur écriture log:', error);
        // En cas d'erreur, stocker localement
        this.storeLocalLog(logData);
      }

      // Toujours logger dans la console pour le développement
      this.consoleLog(entry);

    } catch (error) {
      console.error('❌ Erreur service logging:', error);
      this.storeLocalLog(entry);
    }
  }

  private storeLocalLog(logData: any): void {
    try {
      const localLogs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      localLogs.push({
        ...logData,
        timestamp: new Date().toISOString()
      });
      
      // Garder seulement les 100 derniers logs locaux
      if (localLogs.length > 100) {
        localLogs.splice(0, localLogs.length - 100);
      }
      
      localStorage.setItem('app_logs', JSON.stringify(localLogs));
    } catch (error) {
      console.error('❌ Erreur stockage local logs:', error);
    }
  }

  private consoleLog(entry: LogEntry): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${entry.level}] ${entry.context || 'APP'}:`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.additional_data);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.additional_data);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.additional_data);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, entry.message, entry.additional_data);
        if (entry.stack_trace) {
          console.error('Stack trace:', entry.stack_trace);
        }
        break;
    }
  }

  // Méthodes publiques pour logger
  debug(message: string, context?: string, additionalData?: any): void {
    this.writeLog({
      level: LogLevel.DEBUG,
      message,
      context,
      additional_data: additionalData
    });
  }

  info(message: string, context?: string, additionalData?: any): void {
    this.writeLog({
      level: LogLevel.INFO,
      message,
      context,
      additional_data: additionalData
    });
  }

  warn(message: string, context?: string, additionalData?: any): void {
    this.writeLog({
      level: LogLevel.WARN,
      message,
      context,
      additional_data: additionalData
    });
  }

  error(message: string, context?: string, additionalData?: any, error?: Error): void {
    this.writeLog({
      level: LogLevel.ERROR,
      message,
      context,
      error_type: 'APPLICATION_ERROR',
      stack_trace: error?.stack,
      additional_data: additionalData
    });
  }

  fatal(message: string, context?: string, additionalData?: any, error?: Error): void {
    this.writeLog({
      level: LogLevel.FATAL,
      message,
      context,
      error_type: 'FATAL_ERROR',
      stack_trace: error?.stack,
      additional_data: additionalData
    });
  }

  // Méthodes spécialisées
  logAuthentication(success: boolean, email: string, error?: string): void {
    this.info(
      success ? 'Connexion réussie' : 'Échec de connexion',
      'AUTHENTICATION',
      { email, success, error }
    );
  }

  logApiCall(endpoint: string, method: string, status: number, duration?: number): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.writeLog({
      level,
      message: `API ${method} ${endpoint} - ${status}`,
      context: 'API_CALL',
      error_type: status >= 400 ? 'API_ERROR' : undefined,
      additional_data: { endpoint, method, status, duration }
    });
  }

  logUserAction(action: string, details?: any): void {
    this.info(`Action utilisateur: ${action}`, 'USER_ACTION', details);
  }

  // Méthodes utilitaires
  async getRecentLogs(limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Erreur récupération logs:', error);
      return [];
    }
  }

  getLocalLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]');
    } catch (error) {
      console.error('❌ Erreur lecture logs locaux:', error);
      return [];
    }
  }

  clearLocalLogs(): void {
    localStorage.removeItem('app_logs');
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }
}

// Export de l'instance singleton
export const logger = LoggingService.getInstance();
export default logger;
