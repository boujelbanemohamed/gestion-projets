import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: {
    nom: string;
    prenom: string;
    role?: string;
    fonction?: string;
  }) => Promise<{ user: AuthUser | null; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ user: AuthUser | null; error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour récupérer le profil utilisateur depuis public.users
  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<AuthUser | null> => {
    try {
      console.log('🔍 Récupération du profil utilisateur:', supabaseUser.id);
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('❌ Erreur récupération profil:', error);
        
        // Si le profil n'existe pas, le créer automatiquement
        if (error.code === 'PGRST116') {
          console.log('⚠️ Profil non trouvé, création automatique...');
          return await createUserProfile(supabaseUser);
        }
        
        return null;
      }

      const authUser: AuthUser = {
        id: profile.id,
        email: profile.email,
        nom: profile.nom,
        prenom: profile.prenom,
        role: profile.role,
        fonction: profile.fonction,
        departement_id: profile.departement_id,
      };

      console.log('✅ Profil utilisateur récupéré:', authUser);
      return authUser;
    } catch (error) {
      console.error('❌ Erreur fetchUserProfile:', error);
      return null;
    }
  };

  // Fonction pour créer un profil utilisateur dans public.users
  const createUserProfile = async (supabaseUser: SupabaseUser, additionalData?: {
    nom: string;
    prenom: string;
    role?: string;
    fonction?: string;
  }): Promise<AuthUser | null> => {
    try {
      console.log('📝 Création du profil utilisateur:', supabaseUser.id);
      
      // Extraire les données des métadonnées ou utiliser les données fournies
      const metadata = supabaseUser.user_metadata || {};
      const profileData = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        nom: additionalData?.nom || metadata.nom || 'Nom',
        prenom: additionalData?.prenom || metadata.prenom || 'Prénom',
        role: (additionalData?.role || metadata.role || 'USER') as 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER',
        fonction: additionalData?.fonction || metadata.fonction,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: profile, error } = await supabase
        .from('users')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création profil:', error);
        return null;
      }

      const authUser: AuthUser = {
        id: profile.id,
        email: profile.email,
        nom: profile.nom,
        prenom: profile.prenom,
        role: profile.role,
        fonction: profile.fonction,
        departement_id: profile.departement_id,
      };

      console.log('✅ Profil utilisateur créé:', authUser);
      return authUser;
    } catch (error) {
      console.error('❌ Erreur createUserProfile:', error);
      return null;
    }
  };

  // Fonction d'inscription
  const signUp = async (email: string, password: string, userData: {
    nom: string;
    prenom: string;
    role?: string;
    fonction?: string;
  }) => {
    try {
      console.log('🔐 Inscription utilisateur:', email);
      
      // 1. Créer l'utilisateur dans auth.users avec métadonnées
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nom: userData.nom,
            prenom: userData.prenom,
            role: userData.role || 'USER',
            fonction: userData.fonction,
          }
        }
      });

      if (error) {
        console.error('❌ Erreur inscription auth.users:', error);
        return { user: null, error };
      }

      if (!data.user) {
        console.error('❌ Aucun utilisateur retourné');
        return { user: null, error: new Error('Aucun utilisateur créé') as AuthError };
      }

      console.log('✅ Utilisateur créé dans auth.users:', data.user.id);

      // 2. Créer le profil dans public.users
      const authUser = await createUserProfile(data.user, userData);
      
      if (!authUser) {
        console.error('❌ Échec création profil public.users');
        return { user: null, error: new Error('Échec création profil') as AuthError };
      }

      console.log('✅ Inscription complète réussie');
      return { user: authUser, error: null };

    } catch (error) {
      console.error('❌ Erreur signUp:', error);
      return { user: null, error: error as AuthError };
    }
  };

  // Fonction de connexion
  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Connexion utilisateur:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Erreur connexion:', error);
        return { user: null, error };
      }

      if (!data.user) {
        console.error('❌ Aucun utilisateur retourné');
        return { user: null, error: new Error('Connexion échouée') as AuthError };
      }

      // Récupérer le profil utilisateur
      const authUser = await fetchUserProfile(data.user);
      
      if (!authUser) {
        console.error('❌ Profil utilisateur non trouvé');
        return { user: null, error: new Error('Profil non trouvé') as AuthError };
      }

      console.log('✅ Connexion réussie');
      return { user: authUser, error: null };

    } catch (error) {
      console.error('❌ Erreur signIn:', error);
      return { user: null, error: error as AuthError };
    }
  };

  // Fonction de déconnexion
  const signOut = async () => {
    try {
      console.log('🔐 Déconnexion utilisateur');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
    }
  };

  // Fonction pour rafraîchir les données utilisateur
  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const authUser = await fetchUserProfile(session.user);
        setUser(authUser);
      }
    } catch (error) {
      console.error('❌ Erreur refreshUser:', error);
    }
  };

  // Initialisation et gestion des changements d'état d'authentification
  useEffect(() => {
    console.log('🔄 Initialisation AuthProvider...');
    
    // Récupérer la session existante
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erreur récupération session:', error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('✅ Session existante trouvée:', session.user.email);
          setSession(session);
          
          const authUser = await fetchUserProfile(session.user);
          setUser(authUser);
        } else {
          console.log('ℹ️ Aucune session existante');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('❌ Erreur getInitialSession:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Changement d\'état auth:', event, session?.user?.email);
        
        setSession(session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          const authUser = await fetchUserProfile(session.user);
          setUser(authUser);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
