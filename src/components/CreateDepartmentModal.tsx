import React, { useState } from 'react';
import { X, Save, Building } from 'lucide-react';
import { Department } from '../types';

interface CreateDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (department: Omit<Department, 'id' | 'created_at'>) => void;
  editingDepartment?: Department;
  existingNames: string[];
}

const CreateDepartmentModal: React.FC<CreateDepartmentModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingDepartment,
  existingNames 
}) => {
  const [departmentName, setDepartmentName] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setDepartmentName(editingDepartment?.nom || '');
      setError('');
    }
  }, [isOpen, editingDepartment]);

  const validateForm = () => {
    if (!departmentName.trim()) {
      setError('Le nom du département est obligatoire');
      return false;
    }

    const trimmedName = departmentName.trim();
    const isDuplicate = existingNames.some(name => 
      name.toLowerCase() === trimmedName.toLowerCase() && 
      (!editingDepartment || editingDepartment.nom.toLowerCase() !== trimmedName.toLowerCase())
    );

    if (isDuplicate) {
      setError('Ce nom de département existe déjà');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        nom: departmentName.trim()
      });
      
      setDepartmentName('');
      setError('');
      onClose();
    }
  };

  const handleInputChange = (value: string) => {
    setDepartmentName(value);
    if (error) {
      setError('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="text-blue-600" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editingDepartment ? 'Modifier le département' : 'Créer un département'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label htmlFor="departmentName" className="block text-sm font-medium text-gray-700 mb-2">
              Nom du département <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="departmentName"
              value={departmentName}
              onChange={(e) => handleInputChange(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                error ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Ex: Ressources Humaines"
              autoFocus
            />
            {error && (
              <p className="text-red-600 text-sm mt-1">{error}</p>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <Save size={18} />
              <span>{editingDepartment ? 'Modifier' : 'Créer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDepartmentModal;