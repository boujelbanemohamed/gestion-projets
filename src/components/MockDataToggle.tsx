import React from 'react';
import { toggleMockData, isMockDataEnabled } from '../hooks/useApi';

const MockDataToggle: React.FC = () => {
  const mockEnabled = isMockDataEnabled();

  const handleToggle = () => {
    toggleMockData(!mockEnabled);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleToggle}
        className={`px-4 py-2 rounded-lg font-medium text-sm shadow-lg transition-all duration-200 ${
          mockEnabled
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-gray-500 hover:bg-gray-600 text-white'
        }`}
        title={mockEnabled ? 'Données mockées actives' : 'Activer les données mockées'}
      >
        {mockEnabled ? '🎭 Mock Data ON' : '🗄️ Mock Data OFF'}
      </button>
      
      {mockEnabled && (
        <div className="absolute bottom-full right-0 mb-2 bg-green-100 border border-green-300 rounded-lg p-3 text-sm text-green-800 shadow-lg min-w-64">
          <div className="font-semibold mb-1">✅ Données mockées actives</div>
          <div className="text-xs">
            • 5 départements<br/>
            • 3 projets complets<br/>
            • 4 utilisateurs<br/>
            • 3 PV de réunion<br/>
            • 3 tâches
          </div>
        </div>
      )}
    </div>
  );
};

export default MockDataToggle;
