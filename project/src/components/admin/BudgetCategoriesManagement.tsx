import React, { useEffect, useState } from 'react';
import api from "../../utils/api"; // à adapter selon ton projet
import { AuthUser } from '../../types';

interface BudgetCategoriesManagementProps {
  currentUser: AuthUser;
}

interface Rubrique {
  id: string;
  nom: string;
}

const BudgetCategoriesManagement: React.FC<BudgetCategoriesManagementProps> = ({ currentUser }) => {
  const [rubriques, setRubriques] = useState<Rubrique[]>([]);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editRubrique, setEditRubrique] = useState<Rubrique | null>(null);
  const [nom, setNom] = useState('');

  useEffect(() => {
    fetchRubriques();
  }, []);

  const fetchRubriques = async () => {
    const res = await api.getRubriques();
    setRubriques(Array.isArray(res.data) ? res.data : []);
  };

  const handleDelete = async (id: string) => {
    setError('');
    try {
      await api.deleteRubrique(id);
      fetchRubriques();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(err.response.data.message);
      } else {
        setError("Erreur lors de la suppression");
      }
    }
  };

  const handleEdit = (rubrique: Rubrique) => {
    setEditRubrique(rubrique);
    setNom(rubrique.nom);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditRubrique(null);
    setNom('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    try {
      if (editRubrique) {
        await api.updateRubrique(editRubrique.id, { nom });
      } else {
        await api.createRubrique({ nom });
      }
      setShowModal(false);
      fetchRubriques();
    } catch (err) {
      setError("Erreur lors de l'enregistrement");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold mb-4">Gestion des rubriques budgétaires</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <button className="mb-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={handleAdd}>Ajouter une rubrique</button>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Nom</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rubriques.map(rubrique => (
            <tr key={rubrique.id} className="border-t">
              <td className="p-2">{rubrique.nom}</td>
              <td className="p-2 space-x-2">
                <button className="px-2 py-1 bg-yellow-400 text-white rounded" onClick={() => handleEdit(rubrique)}>Modifier</button>
                <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => handleDelete(rubrique.id)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">{editRubrique ? 'Modifier' : 'Ajouter'} une rubrique</h3>
            <input
              className="w-full border p-2 mb-4"
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder="Nom de la rubrique"
            />
            <div className="flex justify-end space-x-2">
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleSave}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetCategoriesManagement;