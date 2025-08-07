import React, { useState } from 'react';
import { Save, TestTube, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { AuthUser } from '../../types';

interface SMTPConfigurationProps {
  currentUser: AuthUser;
}

interface SMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: 'tls' | 'ssl' | 'none';
  fromEmail: string;
  fromName: string;
  enabled: boolean;
}

const SMTPConfiguration: React.FC<SMTPConfigurationProps> = () => {
  const [config, setConfig] = useState<SMTPConfig>({
    host: '',
    port: 587,
    username: '',
    password: '',
    encryption: 'tls',
    fromEmail: '',
    fromName: '',
    enabled: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: keyof SMTPConfig, value: string | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simuler une sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Configuration SMTP sauvegardée:', config);
      // Ici, vous ajouteriez l'appel API pour sauvegarder la configuration
    } catch {
      // Gestion silencieuse de l'erreur
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Simuler un test de connexion
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simuler un résultat de test (succès ou échec)
      const isSuccess = Math.random() > 0.3; // 70% de chance de succès
      setTestResult(isSuccess ? 'success' : 'error');
    } catch {
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Configuration SMTP</h2>
        <p className="text-sm text-gray-600">
          Configurez les paramètres SMTP pour l'envoi d'emails de notifications.
        </p>
      </div>

      <div className="space-y-6">
        {/* Activation */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Activation SMTP</h3>
            <p className="text-sm text-gray-600">Activez ou désactivez l'envoi d'emails</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => handleInputChange('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Configuration SMTP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Serveur SMTP *
            </label>
            <input
              type="text"
              value={config.host}
              onChange={(e) => handleInputChange('host', e.target.value)}
              placeholder="smtp.gmail.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Port *
            </label>
            <input
              type="number"
              value={config.port}
              onChange={(e) => handleInputChange('port', parseInt(e.target.value))}
              placeholder="587"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom d'utilisateur *
            </label>
            <input
              type="text"
              value={config.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="votre-email@gmail.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={config.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chiffrement
            </label>
            <select
              value={config.encryption}
              onChange={(e) => handleInputChange('encryption', e.target.value as 'tls' | 'ssl' | 'none')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="tls">TLS</option>
              <option value="ssl">SSL</option>
              <option value="none">Aucun</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email d'expédition *
            </label>
            <input
              type="email"
              value={config.fromEmail}
              onChange={(e) => handleInputChange('fromEmail', e.target.value)}
              placeholder="noreply@votreentreprise.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom d'expédition
            </label>
            <input
              type="text"
              value={config.fromName}
              onChange={(e) => handleInputChange('fromName', e.target.value)}
              placeholder="Gestion de Projets"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Test de connexion */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-gray-900">Test de connexion</h3>
              <p className="text-sm text-gray-600">Testez la configuration SMTP</p>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !config.enabled}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TestTube size={16} />
              <span>{isTesting ? 'Test en cours...' : 'Tester la connexion'}</span>
            </button>
          </div>

          {testResult && (
            <div className={`p-4 rounded-md flex items-center space-x-3 ${
              testResult === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {testResult === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span className={`text-sm ${
                testResult === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult === 'success' 
                  ? 'Connexion SMTP réussie !' 
                  : 'Échec de la connexion SMTP. Vérifiez vos paramètres.'
                }
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            onClick={handleSave}
            disabled={isSaving || !config.enabled}
            className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            <span>{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SMTPConfiguration; 