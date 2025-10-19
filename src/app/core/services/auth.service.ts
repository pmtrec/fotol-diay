import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, UserRole } from '../models/user.model';
import { MockAuthService } from './mock-auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private tokenKey = 'auth_token';

  constructor(private mockAuthService: MockAuthService) {
    // Vérifier si l'utilisateur est déjà connecté au démarrage
    this.checkAuthState();
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: UserRole): boolean {
    const user = this.currentUserSubject.value;
    return user ? user.role === role : false;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.currentUserSubject.value;
    return user ? roles.includes(user.role) : false;
  }

  async login(credentials: { email: string; password: string }): Promise<User> {
    try {
      // Use MockAuthService for testing
      const user = await this.mockAuthService.login(credentials.email, credentials.password).toPromise();

      if (user) {
        localStorage.setItem(this.tokenKey, 'mock_token_' + user.id);
        this.currentUserSubject.next(user);
        return user;
      } else {
        throw new Error('Nom d\'utilisateur ou mot de passe incorrect.');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);

      if (error instanceof Error) {
        // Re-throw with more user-friendly message
        if (error.message.includes('serveur') || error.message.includes('404')) {
          throw new Error('Erreur de connexion au serveur. Veuillez réessayer plus tard.');
        }
        throw error;
      } else {
        throw new Error('Erreur inconnue lors de la connexion.');
      }
    }
  }

  logout(): void {
    this.mockAuthService.logout();
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
  }

  async register(userData: { username: string; email: string; password: string; role: UserRole }): Promise<User> {
    try {
      const user = await this.mockAuthService.register(userData).toPromise();

      if (user) {
        localStorage.setItem(this.tokenKey, 'mock_token_' + user.id);
        this.currentUserSubject.next(user);
        return user;
      } else {
        throw new Error('Username already exists');
      }
    } catch (error) {
      throw error;
    }
  }

  private checkAuthState(): void {
    const currentUser = this.mockAuthService.getCurrentUser();
    if (currentUser) {
      this.currentUserSubject.next(currentUser);
    }
  }
}