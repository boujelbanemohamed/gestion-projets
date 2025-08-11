import { createClient } from '@supabase/supabase-js'

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Types pour la base de données
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          nom: string
          prenom: string
          role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER'
          fonction?: string
          departement_id?: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          nom: string
          prenom: string
          role?: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER'
          fonction?: string
          departement_id?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nom?: string
          prenom?: string
          role?: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER'
          fonction?: string
          departement_id?: number
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          nom: string
          description: string
          statut: 'planification' | 'en_cours' | 'en_pause' | 'termine' | 'annule'
          date_debut?: string
          date_fin?: string
          budget?: number
          devise?: string
          avancement?: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          nom: string
          description: string
          statut?: 'planifie' | 'en_cours' | 'en_pause' | 'termine' | 'annule'
          date_debut?: string
          date_fin?: string
          budget?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          nom?: string
          description?: string
          statut?: 'planifie' | 'en_cours' | 'en_pause' | 'termine' | 'annule'
          date_debut?: string
          date_fin?: string
          budget?: number
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          titre: string
          description?: string
          statut: 'todo' | 'en_cours' | 'termine'
          priorite: 'low' | 'medium' | 'high'
          date_debut?: string
          date_fin?: string
          project_id: string
          assigned_to?: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          titre: string
          description?: string
          statut?: 'todo' | 'en_cours' | 'termine'
          priorite?: 'low' | 'medium' | 'high'
          date_debut?: string
          date_fin?: string
          project_id: string
          assigned_to?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          titre?: string
          description?: string
          statut?: 'todo' | 'en_cours' | 'termine'
          priorite?: 'low' | 'medium' | 'high'
          date_debut?: string
          date_fin?: string
          assigned_to?: string
          updated_at?: string
        }
      }
      meeting_minutes: {
        Row: {
          id: number
          titre: string
          date_reunion: string
          description: string
          file_name?: string
          file_path?: string
          taille_fichier?: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          titre: string
          date_reunion: string
          description: string
          file_name?: string
          file_path?: string
          taille_fichier?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          titre?: string
          date_reunion?: string
          description?: string
          file_name?: string
          file_path?: string
          taille_fichier?: number
          updated_at?: string
        }
      }
      meeting_minutes_projects: {
        Row: {
          id: number
          meeting_minute_id: number
          project_id: number
          created_at: string
        }
        Insert: {
          meeting_minute_id: number
          project_id: number
          created_at?: string
        }
        Update: {
          meeting_minute_id?: number
          project_id?: number
        }
      }
      departments: {
        Row: {
          id: number
          nom: string
          description?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          nom: string
          description?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          nom?: string
          description?: string
          updated_at?: string
        }
      }
    }
  }
}
