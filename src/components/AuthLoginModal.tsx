import React, { useState } from 'react';
import { X, LogIn, Eye, EyeOff, User, Lock, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthLoginModal: React.FC<AuthLoginModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [fonction, setFonction] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setNom('');
    setPrenom('');
    setFonction('');
    setError('');
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        console.log('🔐 Tentative de connexion:', email);
        
        const { user, error } = await signIn(email, password);
        
        if (error) {
          console.error('❌ Erreur connexion:', error);
          setError(`Erreur de connexion: ${error.message} (Code: ${error.code || 'UNKNOWN'})`);
          return;
        }
        
        if (user) {
          console.log('✅ Connexion réussie:', user);
          resetForm();
          onClose();
        } else {
          setError('Connexion échouée - Aucun utilisateur retourné');
        }
      } else {
        // Mode inscription
        console.log('📝 Tentative d\'inscription:', email);
        
        if (!nom || !prenom) {
          setError('Le nom et le prénom sont obligatoires');
          return;
        }
        
        const { user, error } = await signUp(email, password, {
          nom,
          prenom,
          fonction,
          role: 'USER'
        });
        
        if (error) {
          console.error('❌ Erreur inscription:', error);
          setError(`Erreur d'inscription: ${error.message} (Code: ${error.code || 'UNKNOWN'})`);
          return;
        }
        
        if (user) {
          console.log('✅ Inscription réussie:', user);
          resetForm();
          onClose();
        } else {
          setError('Inscription échouée - Aucun utilisateur créé');
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur handleSubmit:', error);
      setError(`Erreur: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
    setIsLoading(true);

    try {
      const { user, error } = await signIn(demoEmail, 'password123');
      
      if (error) {
        console.error('❌ Erreur connexion démo:', error);
        setError(`Erreur de connexion démo: ${error.message}`);
        return;
      }
      
      if (user) {
        console.log('✅ Connexion démo réussie:', user);
        resetForm();
        onClose();
      }
    } catch (error: any) {
      console.error('❌ Erreur handleDemoLogin:', error);
      setError(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? 'Connexion' : 'Inscription'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre nom"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre prénom"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fonction
                </label>
                <input
                  type="text"
                  value={fonction}
                  onChange={(e) => setFonction(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Votre fonction (optionnel)"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="votre.email@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Votre mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                {mode === 'login' ? <LogIn className="h-5 w-5 mr-2" /> : <UserPlus className="h-5 w-5 mr-2" />}
                {mode === 'login' ? 'Se connecter' : 'S\'inscrire'}
              </>
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="text-center">
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
              }}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {mode === 'login' 
                ? 'Pas de compte ? S\'inscrire' 
                : 'Déjà un compte ? Se connecter'
              }
            </button>
          </div>

          {mode === 'login' && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center mb-3">
                Comptes de démonstration :
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => handleDemoLogin('marie.dupont@example.com')}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border"
                  disabled={isLoading}
                >
                  <span className="font-medium">Marie Dupont</span> - Super Admin
                </button>
                <button
                  onClick={() => handleDemoLogin('pierre.martin@example.com')}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border"
                  disabled={isLoading}
                >
                  <span className="font-medium">Pierre Martin</span> - Admin
                </button>
                <button
                  onClick={() => handleDemoLogin('sophie.lemoine@example.com')}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border"
                  disabled={isLoading}
                >
                  <span className="font-medium">Sophie Lemoine</span> - Utilisateur
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthLoginModal;
