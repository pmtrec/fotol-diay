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
        throw new Error('Identifiants incorrects');
      }
    } catch (error) {
      throw error;
    }
  }

  logout(): void {
    this.mockAuthService.logout();
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
  }

  private checkAuthState(): void {
    const currentUser = this.mockAuthService.getCurrentUser();
    if (currentUser) {
      this.currentUserSubject.next(currentUser);
    }
  }
}