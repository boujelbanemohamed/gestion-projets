import { AuthUser, Project, Task, User, Department, Comment } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth methods
  async login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
    const response = await this.request<{ user: AuthUser; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.token = response.token;
    localStorage.setItem('auth_token', response.token);
    
    return response;
  }

  async register(userData: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    fonction?: string;
    departement_id?: string;
    role?: string;
  }): Promise<{ user: AuthUser; token: string }> {
    const response = await this.request<{ user: AuthUser; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    this.token = response.token;
    localStorage.setItem('auth_token', response.token);
    
    return response;
  }

  async getCurrentUser(): Promise<{ user: AuthUser }> {
    return this.request<{ user: AuthUser }>('/auth/me');
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Projects methods
  async getProjects(params?: {
    page?: number;
    limit?: number;
    search?: string;
    departement_id?: string;
  }): Promise<{
    projects: Project[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const query = searchParams.toString();
    return this.request<any>(`/projects${query ? `?${query}` : ''}`);
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(projectData: {
    nom: string;
    description?: string;
    departement_id?: string;
  }): Promise<{ project: Project; message: string }> {
    return this.request<{ project: Project; message: string }>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(id: string, projectData: {
    nom?: string;
    description?: string;
    departement_id?: string;
  }): Promise<{ project: Project; message: string }> {
    return this.request<{ project: Project; message: string }>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async getProjectStats(id: string): Promise<{
    total_taches: number;
    non_debutees: number;
    en_cours: number;
    terminees: number;
    membres_assignes: number;
    percentage: number;
  }> {
    return this.request<any>(`/projects/${id}/stats`);
  }

  // Tasks methods
  async getProjectTasks(projectId: string, params?: {
    status?: string;
    assigned_to?: string;
  }): Promise<{ tasks: Task[] }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value);
        }
      });
    }

    const query = searchParams.toString();
    return this.request<{ tasks: Task[] }>(`/tasks/project/${projectId}${query ? `?${query}` : ''}`);
  }

  async getTask(id: string): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`);
  }

  async createTask(taskData: {
    nom: string;
    description?: string;
    scenario_execution?: string;
    criteres_acceptation?: string;
    etat?: string;
    date_realisation: string;
    projet_id: string;
    utilisateurs: string[];
  }): Promise<{ task: Task; message: string }> {
    return this.request<{ task: Task; message: string }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(id: string, taskData: {
    nom?: string;
    description?: string;
    scenario_execution?: string;
    criteres_acceptation?: string;
    etat?: string;
    date_realisation?: string;
    utilisateurs?: string[];
  }): Promise<{ task: Task; message: string }> {
    return this.request<{ task: Task; message: string }>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Users methods
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    departement_id?: string;
    role?: string;
  }): Promise<{
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const query = searchParams.toString();
    return this.request<any>(`/users${query ? `?${query}` : ''}`);
  }

  async getUser(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async createUser(userData: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    fonction?: string;
    departement_id?: string;
    role?: string;
  }): Promise<{ user: User; message: string }> {
    return this.request<{ user: User; message: string }>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: {
    nom?: string;
    prenom?: string;
    email?: string;
    fonction?: string;
    departement_id?: string;
    role?: string;
  }): Promise<{ user: User; message: string }> {
    return this.request<{ user: User; message: string }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async assignProjectsToUser(userId: string, projectIds: string[]): Promise<{ user: User; message: string }> {
    return this.request<{ user: User; message: string }>(`/users/${userId}/projects`, {
      method: 'PUT',
      body: JSON.stringify({ project_ids: projectIds }),
    });
  }

  async getUserProjects(userId: string): Promise<{ user: User; projects: Project[] }> {
    return this.request<{ user: User; projects: Project[] }>(`/users/${userId}/projects`);
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Departments methods
  async getDepartments(): Promise<{ departments: Department[] }> {
    return this.request<{ departments: Department[] }>('/departments');
  }

  async createDepartment(departmentData: {
    nom: string;
  }): Promise<{ department: Department; message: string }> {
    return this.request<{ department: Department; message: string }>('/departments', {
      method: 'POST',
      body: JSON.stringify(departmentData),
    });
  }

  async updateDepartment(id: string, departmentData: {
    nom: string;
  }): Promise<{ department: Department; message: string }> {
    return this.request<{ department: Department; message: string }>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(departmentData),
    });
  }

  async deleteDepartment(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/departments/${id}`, {
      method: 'DELETE',
    });
  }

  // Comments methods
  async getTaskComments(taskId: string): Promise<{ comments: Comment[] }> {
    return this.request<{ comments: Comment[] }>(`/comments/task/${taskId}`);
  }

  async createComment(commentData: {
    contenu: string;
    tache_id: string;
  }): Promise<{ comment: Comment; message: string }> {
    return this.request<{ comment: Comment; message: string }>('/comments', {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  async deleteComment(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/comments/${id}`, {
      method: 'DELETE',
    });
  }

  // File upload methods
  async uploadProjectFile(projectId: string, file: File): Promise<{ attachment: any; message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<{ attachment: any; message: string }>(`/uploads/project/${projectId}`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });
  }

  async uploadTaskFile(taskId: string, file: File): Promise<{ attachment: any; message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<{ attachment: any; message: string }>(`/uploads/task/${taskId}`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });
  }

  async uploadCommentFile(commentId: string, file: File): Promise<{ attachment: any; message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<{ attachment: any; message: string }>(`/uploads/comment/${commentId}`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });
  }

  async deleteFile(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/uploads/${id}`, {
      method: 'DELETE',
    });
  }

  // Project expenses methods
  async getProjectExpenses(projectId: string): Promise<{ expenses: any[] }> {
    return this.request<{ expenses: any[] }>(`/projects/${projectId}/expenses`);
  }

  async createProjectExpense(projectId: string, expenseData: {
    date_depense: string;
    intitule: string;
    montant: number;
    devise: string;
    taux_conversion?: number;
    montant_converti?: number;
    rubrique?: string;
    description?: string;
  }): Promise<{ expense: any; message: string }> {
    return this.request<{ expense: any; message: string }>(`/projects/${projectId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  }

  async updateProjectExpense(projectId: string, expenseId: string, expenseData: {
    date_depense: string;
    intitule: string;
    montant: number;
    devise: string;
    taux_conversion?: number;
    montant_converti?: number;
    rubrique?: string;
    description?: string;
  }): Promise<{ expense: any; message: string }> {
    return this.request<{ expense: any; message: string }>(`/projects/${projectId}/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  }

  async deleteProjectExpense(projectId: string, expenseId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/projects/${projectId}/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();