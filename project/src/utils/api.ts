import axios from 'axios';

const API_URL = '/api/rubriques';

export const getRubriques = () => axios.get(API_URL);
export const createRubrique = (data: { nom: string }) => axios.post(API_URL, data);
export const updateRubrique = (id: string, data: { nom: string }) => axios.put(`${API_URL}/${id}`, data);
export const deleteRubrique = (id: string) => axios.delete(`${API_URL}/${id}`);

export default {
  getRubriques,
  createRubrique,
  updateRubrique,
  deleteRubrique,
};