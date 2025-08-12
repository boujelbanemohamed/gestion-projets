import React, { useState } from 'react';
import { X, LogIn, Eye, EyeOff, User, Lock } from 'lucide-react';
import { User as UserType } from '../types';
import { useApi } from '../hooks/useApi';
import { useToast } from './Toast';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserType) => void;
  users: UserType[];
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, users }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const api = useApi();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Utiliser l'API Supabase ou locale selon la configuration
      const response = await api.login(email, password);

      if (response.user) {
        onLogin(response.user);
        onClose();
        setEmail('');
        setPassword('');
        showToast('Connexion réussie !', 'success', 3000);
      } else {
        const errorMsg = 'Email ou mot de passe incorrect';
        setError(errorMsg);
        showToast(errorMsg, 'error', 4000);
      }
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      const errorMsg = error.message || 'Email ou mot de passe incorrect';
      setError(errorMsg);
      showToast(errorMsg, 'error', 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (role: 'SUPER_ADMIN' | 'ADMIN' | 'UTILISATEUR') => {
    const demoUser = users.find(u => u.role === role);
    if (demoUser) {
      setEmail(demoUser.email);
      setPassword('password123');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <LogIn className="text-blue-600" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Connexion</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="votre.email@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Votre mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <LogIn size={18} />
                <span>Se connecter</span>
              </>
            )}
          </button>

          {/* Demo accounts */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-3 text-center">Comptes de démonstration :</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('SUPER_ADMIN')}
                className="w-full px-3 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('ADMIN')}
                className="w-full px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('UTILISATEUR')}
                className="w-full px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
              >
                Utilisateur
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Mots de passe acceptés : password123, admin, test, password, 123456
            </p>
            <p className="text-xs text-gray-400 mt-1 text-center">
              Ou utilisez le prénom en minuscules (ex: marie, pierre)
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;