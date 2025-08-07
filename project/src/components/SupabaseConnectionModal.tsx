import React, { useState } from 'react';
import { X, Database, AlertCircle, CheckCircle, Copy, ExternalLink } from 'lucide-react';

interface SupabaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (url: string, key: string) => void;
}

const SupabaseConnectionModal: React.FC<SupabaseConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnect
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [step, setStep] = useState(1);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (!supabaseUrl.includes('supabase.co')) {
      setError('L\'URL Supabase doit contenir "supabase.co"');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      // Test de connexion basique
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (response.ok || response.status === 404) {
        // 404 est normal pour l'endpoint racine
        onConnect(supabaseUrl, supabaseKey);
        onClose();
      } else {
        setError('Impossible de se connecter à Supabase. Vérifiez vos paramètres.');
      }
    } catch {
      setError('Erreur de connexion. Vérifiez votre URL et votre clé.');
    } finally {
      setIsConnecting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Database className="text-green-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Connecter à Supabase
              </h2>
              <p className="text-sm text-gray-500">
                Configurez votre base de données Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-2">Avant de commencer :</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Créez un compte sur <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase</a></li>
                      <li>Créez un nouveau projet</li>
                      <li>Exécutez les migrations SQL fournies</li>
                      <li>Récupérez vos clés API</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Étape 1 : Récupérer vos clés Supabase
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start space-x-2">
                      <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">1</span>
                      <div>
                        <p>Allez dans votre <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center space-x-1">
                          <span>dashboard Supabase</span>
                          <ExternalLink size={12} />
                        </a></p>
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">2</span>
                      <p>Sélectionnez votre projet</p>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">3</span>
                      <p>Allez dans <strong>Settings</strong> → <strong>API</strong></p>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">4</span>
                      <p>Copiez l'<strong>URL du projet</strong> et la <strong>clé anon public</strong></p>
                    </li>
                  </ol>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    J'ai mes clés
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Étape 2 : Configurer la connexion
                </h3>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="text-red-600" size={16} />
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="supabaseUrl" className="block text-sm font-medium text-gray-700 mb-2">
                      URL du projet Supabase <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        id="supabaseUrl"
                        value={supabaseUrl}
                        onChange={(e) => setSupabaseUrl(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                        placeholder="https://votre-projet.supabase.co"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(supabaseUrl)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        title="Copier"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Format : https://votre-projet.supabase.co
                    </p>
                  </div>

                  <div>
                    <label htmlFor="supabaseKey" className="block text-sm font-medium text-gray-700 mb-2">
                      Clé anonyme (anon public) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <textarea
                        id="supabaseKey"
                        value={supabaseKey}
                        onChange={(e) => setSupabaseKey(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 resize-none"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(supabaseKey)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        title="Copier"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Longue chaîne commençant par "eyJhbGciOiJIUzI1NiIs..."
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="text-green-600 mt-0.5" size={20} />
                    <div className="text-sm text-green-800">
                      <p className="font-medium mb-1">Sécurité :</p>
                      <p>La clé anonyme peut être exposée côté client en toute sécurité. Elle est limitée par les politiques RLS de Supabase.</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting || !supabaseUrl.trim() || !supabaseKey.trim()}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {isConnecting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Connexion...</span>
                      </>
                    ) : (
                      <>
                        <Database size={16} />
                        <span>Se connecter</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupabaseConnectionModal;