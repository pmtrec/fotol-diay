import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User, UserRole } from '../models/user.model';
import { MockDataService } from './mock-data.service';

@Injectable({
  providedIn: 'root'
})
export class MockAuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private mockDataService: MockDataService) {
    // Auto-login as admin for testing
    this.autoLogin();
  }

  private autoLogin(): void {
    // For testing purposes, automatically log in as admin
    this.mockDataService.getUserById(1).subscribe(user => {
      if (user) {
        this.currentUserSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
    });
  }

  login(username: string, password: string): Observable<User | null> {
    // Simple mock authentication - in real app this would call an API
    const mockCredentials: { [key: string]: { password: string; user: User } } = {
      'admin': { password: 'admin123', user: {
        id: 1, username: 'admin', email: 'admin@klick.com', role: UserRole.ADMIN,
        firstName: 'Admin', lastName: 'Klick', isActive: true,
        createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01'),
        permissions: ['all']
      }},
      'vendeur1': { password: 'vendeur123', user: {
        id: 2, username: 'vendeur1', email: 'vendeur1@klick.com', role: UserRole.SELLER,
        firstName: 'Marie', lastName: 'Dubois', isActive: true,
        createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15'),
        businessName: 'Boutique Marie', businessDescription: 'Mode et accessoires féminins'
      }},
      'vendeur2': { password: 'vendeur123', user: {
        id: 3, username: 'vendeur2', email: 'vendeur2@klick.com', role: UserRole.SELLER,
        firstName: 'Jean', lastName: 'Martin', isActive: true,
        createdAt: new Date('2024-02-01'), updatedAt: new Date('2024-02-01'),
        businessName: 'TechStore Jean', businessDescription: 'Électronique et gadgets'
      }},
      'client1': { password: 'client123', user: {
        id: 4, username: 'client1', email: 'client1@klick.com', role: UserRole.CUSTOMER,
        firstName: 'Sophie', lastName: 'Bernard', isActive: true,
        createdAt: new Date('2024-03-01'), updatedAt: new Date('2024-03-01')
      }}
    };

    const credentials = mockCredentials[username];
    if (credentials && credentials.password === password) {
      this.currentUserSubject.next(credentials.user);
      localStorage.setItem('currentUser', JSON.stringify(credentials.user));
      return of(credentials.user);
    }

    return of(null);
  }

  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  hasRole(role: UserRole): boolean {
    const user = this.currentUserSubject.value;
    return user ? user.role === role : false;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.currentUserSubject.value;
    return user ? roles.includes(user.role) : false;
  }
}