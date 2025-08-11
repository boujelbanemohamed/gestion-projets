import React, { memo, useCallback, useEffect, useState } from 'react';
import { Task } from '../types';

interface TaskListProps {
  projectId: string;
  onTasksLoaded: (tasks: Task[]) => void;
}

const TaskList: React.FC<TaskListProps> = memo(({ projectId, onTasksLoaded }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction de chargement des tâches avec API directe Supabase
  const loadTasks = useCallback(async () => {
    console.log('🚀 TaskList: Chargement tâches pour projet:', projectId);
    setLoading(true);
    setError(null);

    try {
      // API directe Supabase (plus fiable que useApi)
      const response = await fetch(`https://obdadipsbbrlwetkuyui.supabase.co/rest/v1/tasks?select=*&project_id=eq.${projectId}`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGFkaXBzYmJybHdldGt1eXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODgxMjMsImV4cCI6MjA3MDA2NDEyM30.jracnTOp7Y0QBTbt7qjY4076aBqh3pq7DR-rU_U33fo'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const supabaseTasks = await response.json();
      console.log('✅ TaskList: Tâches reçues:', supabaseTasks.length);

      // Mapping Supabase → Interface
      const convertedTasks: Task[] = supabaseTasks.map((task: any) => {
        const mappedStatus = mapSupabaseToUI(task.statut);
        console.log(`🔄 TaskList: Mapping ${task.statut} → ${mappedStatus}`);

        return {
          id: task.id,
          nom: task.titre || 'Tâche sans nom',
          description: task.description || '',
          etat: mappedStatus,
          priorite: task.priorite || 'medium',
          date_debut: task.date_debut ? new Date(task.date_debut) : undefined,
          date_fin: task.date_fin ? new Date(task.date_fin) : undefined,
          date_realisation: task.date_fin ? new Date(task.date_fin) : new Date(),
          projet_id: task.project_id,
          utilisateurs: [],
          commentaires: [],
          history: [],
          attachments: []
        };
      });

      console.log('✅ TaskList: Tâches converties:', convertedTasks.length);
      setTasks(convertedTasks);
      onTasksLoaded(convertedTasks);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ TaskList: Erreur chargement:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [projectId, onTasksLoaded]);

  // Mapping des statuts Supabase vers Interface
  const mapSupabaseToUI = useCallback((status: string | null): 'non_debutee' | 'en_cours' | 'cloturee' => {
    if (!status) return 'non_debutee';
    
    const statusMap: { [key: string]: 'non_debutee' | 'en_cours' | 'cloturee' } = {
      'todo': 'non_debutee',
      'en_cours': 'en_cours',
      'termine': 'cloturee',
      'annule': 'cloturee'
    };
    
    return statusMap[status] || 'non_debutee';
  }, []);

  // Chargement initial
  useEffect(() => {
    if (projectId) {
      loadTasks();
    }
  }, [projectId, loadTasks]);

  // Interface de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement des tâches...</span>
      </div>
    );
  }

  // Interface d'erreur
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-600 font-medium">Erreur de chargement</div>
        </div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button
          onClick={loadTasks}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Interface des tâches
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Tâches ({tasks.length})
        </h3>
        <button
          onClick={loadTasks}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Actualiser
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucune tâche pour ce projet
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
});

// Composant TaskCard simple
const TaskCard: React.FC<{ task: Task }> = memo(({ task }) => {
  const statusColors = {
    'non_debutee': 'bg-gray-100 text-gray-800',
    'en_cours': 'bg-yellow-100 text-yellow-800',
    'cloturee': 'bg-green-100 text-green-800'
  };

  const priorityColors = {
    'low': 'border-l-green-500',
    'medium': 'border-l-yellow-500',
    'high': 'border-l-orange-500',
    'urgent': 'border-l-red-500'
  };

  return (
    <div className={`bg-white border-l-4 ${priorityColors[task.priorite as keyof typeof priorityColors]} rounded-lg shadow-sm p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{task.nom}</h4>
          {task.description && (
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          )}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.etat]}`}>
          {task.etat === 'non_debutee' ? 'À faire' : 
           task.etat === 'en_cours' ? 'En cours' : 'Terminé'}
        </span>
      </div>
      
      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
        <span>Priorité: {task.priorite}</span>
        {task.date_realisation && (
          <span>{task.date_realisation.toLocaleDateString('fr-FR')}</span>
        )}
      </div>
    </div>
  );
});

TaskList.displayName = 'TaskList';
TaskCard.displayName = 'TaskCard';

export default TaskList;
