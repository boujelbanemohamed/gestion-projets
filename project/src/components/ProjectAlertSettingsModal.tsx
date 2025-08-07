import React, { useState } from 'react';
import { X, Bell, Save, Info } from 'lucide-react';
import { DEFAULT_ALERT_THRESHOLD } from '../utils/alertsConfig';

interface ProjectAlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThreshold: number;
  onSave: (threshold: number) => void;
}

const ProjectAlertSettingsModal: React.FC<ProjectAlertSettingsModalProps> = ({
  isOpen,
  onClose,
  currentThreshold,
  onSave
}) => {
  const [threshold, setThreshold] = useState(currentThreshold);

  React.useEffect(() => {
    if (isOpen) {
      setThreshold(currentThreshold);
    }
  }, [isOpen, currentThreshold]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(threshold);
  };

  const handleReset = () => {
    setThreshold(DEFAULT_ALERT_THRESHOLD);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="text-blue-600" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Configuration des alertes
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="text-blue-600 mt-0.5" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">À propos des alertes d'échéance</p>
                <p>Les alertes vous permettent d'être notifié lorsqu'un projet approche de sa date de fin. Vous pouvez définir le nombre de jours avant l'échéance à partir duquel vous souhaitez être alerté.</p>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 mb-2">
              Seuil d'alerte (en jours)
            </label>
            <input
              type="number"
              id="threshold"
              min="1"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value) || DEFAULT_ALERT_THRESHOLD)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Vous serez alerté lorsqu'un projet arrive à {threshold} jour{threshold > 1 ? 's' : ''} de sa date de fin.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Bell className="text-yellow-600 mt-0.5" size={20} />
              <div className="text-sm text-yellow-800">
                <p>Avec le paramètre actuel, vous recevrez des alertes :</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Lorsqu'un projet arrive à {threshold} jour{threshold > 1 ? 's' : ''} de sa date de fin</li>
                  <li>Lorsqu'un projet a dépassé sa date de fin</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Réinitialiser ({DEFAULT_ALERT_THRESHOLD} jours)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Save size={16} />
              <span>Enregistrer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectAlertSettingsModal;