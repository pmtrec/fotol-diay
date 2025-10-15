import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { User, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    const expectedRoles = route.data['roles'] as UserRole[];

    if (!expectedRoles || expectedRoles.length === 0) {
      return true; // Pas de restriction de rôle
    }

    return this.authService.currentUser$.pipe(
      map(user => {
        if (!user) {
          this.router.navigate(['/auth/login']);
          return false;
        }

        const hasRole = expectedRoles.includes(user.role);

        if (!hasRole) {
          this.router.navigate(['/error/404']);
          return false;
        }

        return true;
      })
    );
  }
}