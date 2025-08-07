import { AuthUser, User } from '../types';

// Mock authentication service
export class AuthService {
  private static readonly STORAGE_KEY = 'auth_user';
  
  static login(email: string, password: string, users: User[]): AuthUser | null {
    // In a real app, this would make an API call
    const user = users.find(u => u.email === email);
    
    if (user && password === 'password123') { // Mock password check
      const authUser: AuthUser = {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        fonction: user.fonction,
        departement: user.departement,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authUser));
      return authUser;
    }
    
    return null;
  }
  
  static logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
  
  static getCurrentUser(): AuthUser | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored);
        // Convert date strings back to Date objects
        user.created_at = new Date(user.created_at);
        return user;
      } catch {
        return null;
      }
    }
    return null;
  }
  
  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
  
  static updatePassword(currentPassword: string): boolean {
    // In a real app, this would make an API call
    if (currentPassword === 'password123') {
      // Mock password update
      return true;
    }
    return false;
  }
  
  static updateProfile(userData: Partial<AuthUser>): boolean {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedUser));
      return true;
    }
    return false;
  }
}