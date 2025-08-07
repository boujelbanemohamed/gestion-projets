import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Search, Clock, Play, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Task } from '../types';
import { getStatusColor, getStatusText } from '../utils/calculations';

interface GanttChartProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onShowComments: (task: Task) => void;
  onShowDetails: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

type ViewMode = 'day' | 'week' | 'month';

interface GanttTask {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: string;
  assignees: string[];
  originalTask: Task;
}

const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  onTaskClick,
  onShowComments,
  onShowDetails,
  onDeleteTask
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  

  const scrollRef = useRef<HTMLDivElement>(null);

  // Get all unique users from tasks
  const allUsers = Array.from(
    new Map(
      tasks.flatMap(task => task.utilisateurs).map(user => [user.id, user])
    ).values()
  );

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.etat === filterStatus;
    const matchesUser = filterUser === 'all' || task.utilisateurs.some(user => user.id === filterUser);
    const hasDate = task.date_realisation; // Only show tasks with dates
    
    return matchesSearch && matchesStatus && matchesUser && hasDate;
  });

  // Convert tasks to Gantt format
  const ganttTasks: GanttTask[] = filteredTasks.map(task => ({
    id: task.id,
    name: task.nom,
    startDate: new Date(task.date_realisation),
    endDate: new Date(task.date_realisation), // For now, tasks are single-day events
    status: task.etat,
    assignees: task.utilisateurs.map(u => `${u.prenom} ${u.nom}`),
    originalTask: task
  }));

  // Calculate date range for the view
  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        start.setDate(start.getDate() - 3);
        end.setDate(end.getDate() + 3);
        break;
      case 'week':
        start.setDate(start.getDate() - start.getDay() - 14); // 2 weeks before
        end.setDate(end.getDate() + (6 - end.getDay()) + 14); // 2 weeks after
        break;
      case 'month':
        start.setMonth(start.getMonth() - 2);
        start.setDate(1);
        end.setMonth(end.getMonth() + 2);
        end.setDate(0); // Last day of month
        break;
    }

    return { start, end };
  };

  const { start: startDate, end: endDate } = getDateRange();

  // Generate time columns
  const generateTimeColumns = () => {
    const columns = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      columns.push(new Date(current));
      
      switch (viewMode) {
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }

    return columns;
  };

  const timeColumns = generateTimeColumns();

  // Calculate task position and width
  const getTaskPosition = (task: GanttTask) => {
    const totalDuration = endDate.getTime() - startDate.getTime();
    const taskStart = task.startDate.getTime() - startDate.getTime();
    const taskDuration = task.endDate.getTime() - task.startDate.getTime();
    
    // Minimum duration for visibility (1 day)
    const minDuration = 24 * 60 * 60 * 1000;
    const displayDuration = Math.max(taskDuration, minDuration);
    
    const left = (taskStart / totalDuration) * 100;
    const width = (displayDuration / totalDuration) * 100;
    
    return { left: Math.max(0, left), width: Math.min(width, 100 - left) };
  };

  // Get task color based on status
  const getTaskColor = (status: string) => {
    switch (status) {
      case 'non_debutee': return 'bg-gray-400';
      case 'en_cours': return 'bg-orange-400';
      case 'cloturee': return 'bg-green-400';
      default: return 'bg-gray-400';
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    switch (viewMode) {
      case 'day':
        return date.toLocaleDateString('fr-FR', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        });
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;
      case 'month':
        return date.toLocaleDateString('fr-FR', { 
          month: 'long', 
          year: 'numeric' 
        });
      default:
        return date.toLocaleDateString('fr-FR');
    }
  };

  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle task hover for tooltip
  const handleTaskMouseEnter = (task: GanttTask, event: React.MouseEvent) => {
    setHoveredTask(task.id);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleTaskMouseLeave = () => {
    setHoveredTask(null);
  };

  const handleTaskMouseMove = (event: React.MouseEvent) => {
    if (hoveredTask) {
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }
  };

  // Auto-scroll to current date on mount
  useEffect(() => {
    if (scrollRef.current) {
      const today = new Date();
      const totalDuration = endDate.getTime() - startDate.getTime();
      const todayPosition = (today.getTime() - startDate.getTime()) / totalDuration;
      const scrollPosition = todayPosition * scrollRef.current.scrollWidth;
      scrollRef.current.scrollLeft = Math.max(0, scrollPosition - scrollRef.current.clientWidth / 2);
    }
  }, [viewMode, currentDate]);

  const tasksWithoutDates = tasks.filter(task => !task.date_realisation).length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header Controls */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* View Mode and Navigation */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-white rounded-lg border border-gray-300 p-1">
              {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {mode === 'day' ? 'Jour' : mode === 'week' ? 'Semaine' : 'Mois'}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={navigatePrevious}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Aujourd'hui
              </button>
              <button
                onClick={navigateNext}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher une tâche..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les états</option>
              <option value="non_debutee">Non débutées</option>
              <option value="en_cours">En cours</option>
              <option value="cloturee">Clôturées</option>
            </select>

            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les membres</option>
              {allUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.prenom} {user.nom}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Warning for tasks without dates */}
        {tasksWithoutDates > 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Calendar className="text-amber-600" size={16} />
              <p className="text-sm text-amber-800">
                <span className="font-medium">{tasksWithoutDates} tâche{tasksWithoutDates > 1 ? 's' : ''}</span> sans date de réalisation ne {tasksWithoutDates > 1 ? 'sont' : 'peut'} pas être affichée{tasksWithoutDates > 1 ? 's' : ''} dans le diagramme de Gantt.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Gantt Chart */}
      <div className="relative">
        {ganttTasks.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune tâche à afficher
            </h3>
            <p className="text-gray-500">
              {tasksWithoutDates > 0 
                ? 'Les tâches doivent avoir une date de réalisation pour être affichées dans le Gantt.'
                : 'Aucune tâche ne correspond aux critères de filtrage sélectionnés.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Time Header */}
            <div 
              ref={scrollRef}
              className="overflow-x-auto border-b border-gray-200"
              style={{ scrollbarWidth: 'thin' }}
            >
              <div className="flex bg-gray-50" style={{ minWidth: '800px' }}>
                <div className="w-64 flex-shrink-0 p-3 border-r border-gray-200 bg-white">
                  <span className="text-sm font-medium text-gray-900">Tâches ({ganttTasks.length})</span>
                </div>
                <div className="flex-1 relative">
                  <div className="flex h-12">
                    {timeColumns.map((date, index) => (
                      <div
                        key={index}
                        className="flex-1 min-w-0 p-2 border-r border-gray-200 text-center"
                      >
                        <span className="text-xs font-medium text-gray-700">
                          {formatDate(date)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks */}
            <div 
              className="overflow-x-auto max-h-96 overflow-y-auto"
              style={{ scrollbarWidth: 'thin' }}
              onScroll={(e) => {
                if (scrollRef.current) {
                  scrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                }
              }}
            >
              <div style={{ minWidth: '800px' }}>
                {ganttTasks.map((task, index) => {
                  const position = getTaskPosition(task);
                  const isOverdue = new Date(task.startDate) < new Date() && task.status !== 'cloturee';
                  
                  return (
                    <div
                      key={task.id}
                      className={`flex border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                      }`}
                    >
                      {/* Task Name */}
                      <div className="w-64 flex-shrink-0 p-3 border-r border-gray-200">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {task.status === 'non_debutee' && <Clock size={14} className="text-gray-500" />}
                            {task.status === 'en_cours' && <Play size={14} className="text-orange-500" />}
                            {task.status === 'cloturee' && <CheckCircle size={14} className="text-green-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {task.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {task.assignees.join(', ')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="flex-1 relative p-2">
                        <div className="relative h-8">
                          {/* Task Bar */}
                          <div
                            className={`absolute top-1 h-6 rounded-md cursor-pointer transition-all duration-200 hover:shadow-md ${getTaskColor(task.status)} ${
                              isOverdue ? 'ring-2 ring-red-400' : ''
                            }`}
                            style={{
                              left: `${position.left}%`,
                              width: `${Math.max(position.width, 2)}%`
                            }}
                            onClick={() => onTaskClick(task.originalTask)}
                            onMouseEnter={(e) => handleTaskMouseEnter(task, e)}
                            onMouseLeave={handleTaskMouseLeave}
                            onMouseMove={handleTaskMouseMove}
                          >
                            <div className="h-full flex items-center px-2">
                              <span className="text-xs font-medium text-white truncate">
                                {task.name}
                              </span>
                            </div>
                            {isOverdue && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>

                          {/* Today Line */}
                          {(() => {
                            const today = new Date();
                            const totalDuration = endDate.getTime() - startDate.getTime();
                            const todayPosition = (today.getTime() - startDate.getTime()) / totalDuration * 100;
                            
                            if (todayPosition >= 0 && todayPosition <= 100) {
                              return (
                                <div
                                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                                  style={{ left: `${todayPosition}%` }}
                                >
                                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full"></div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tooltip */}
        {hoveredTask && (
          <div
            className="fixed z-50 bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-xs pointer-events-none"
            style={{
              left: tooltipPosition.x + 10,
              top: tooltipPosition.y - 10,
              transform: 'translateY(-100%)'
            }}
          >
            {(() => {
              const task = ganttTasks.find(t => t.id === hoveredTask);
              if (!task) return null;
              
              const isOverdue = new Date(task.startDate) < new Date() && task.status !== 'cloturee';
              
              return (
                <div className="space-y-2">
                  <div className="font-semibold">{task.name}</div>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(task.status)}`}>
                        {getStatusText(task.status)}
                      </span>
                      {isOverdue && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                          En retard
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-300">Date :</span> {task.startDate.toLocaleDateString('fr-FR')}
                    </div>
                    <div>
                      <span className="text-gray-300">Assigné à :</span> {task.assignees.join(', ')}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <span className="text-sm font-medium text-gray-700">Légende :</span>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span className="text-sm text-gray-600">Non débutée</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-400 rounded"></div>
                <span className="text-sm text-gray-600">En cours</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-400 rounded"></div>
                <span className="text-sm text-gray-600">Clôturée</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-0.5 h-4 bg-red-500"></div>
                <span className="text-sm text-gray-600">Aujourd'hui</span>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Cliquez sur une tâche pour la modifier
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;