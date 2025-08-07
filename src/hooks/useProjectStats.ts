import { useMemo } from 'react';
import { Project, User } from '../types';
import { getProjectStats } from '../utils/calculations';

export const useProjectStats = (project: Project) => {
  return useMemo(() => getProjectStats(project.taches), [project.taches]);
};

export const useProjectMembers = (project: Project) => {
  return useMemo(() => 
    Array.from(
      new Map(
        project.taches
          .flatMap(task => task.utilisateurs)
          .map(user => [user.id, user])
      ).values()
    ), 
    [project.taches]
  );
};

export const useProjectManager = (project: Project) => {
  return useMemo(() => {
    if (!project.responsable_id) return null;
    return project.taches
      .flatMap(t => t.utilisateurs)
      .find(user => user.id === project.responsable_id) || null;
  }, [project.responsable_id, project.taches]);
};
