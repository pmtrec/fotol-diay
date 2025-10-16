import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PubliciteComponent } from '../bandePublicite/publicite.component';
import { CartService } from '../../../../core/services/cart.service';
import { Cart } from '../../../../core/models/cart.model';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, PubliciteComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  cartItemCount = 0;
  currentUser: User | null = null;
  showUserDropdown = false;
  private destroy$ = new Subject<void>();

  constructor(
    private cartService: CartService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Subscribe to cart changes
    this.cartService.getCart()
      .pipe(takeUntil(this.destroy$))
      .subscribe((cart: Cart) => {
        this.cartItemCount = cart.itemCount;
      });

    // Subscribe to authentication changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  logout(): void {
    this.authService.logout();
    this.showUserDropdown = false;
    this.router.navigate(['/']);
  }

  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
    this.showUserDropdown = false;
  }

  goToDashboard(): void {
    if (this.currentUser) {
      switch (this.currentUser.role) {
        case 'admin':
          this.router.navigate(['/admin']);
          break;
        case 'seller':
          this.router.navigate(['/vendeur']);
          break;
        case 'customer':
          this.router.navigate(['/dashboard']);
          break;
        default:
          this.router.navigate(['/']);
      }
    }
    this.showUserDropdown = false;
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return '';

    if (this.currentUser.firstName && this.currentUser.lastName) {
      return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }

    return this.currentUser.username || 'Utilisateur';
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'U';

    if (this.currentUser.firstName && this.currentUser.lastName) {
      return (this.currentUser.firstName[0] + this.currentUser.lastName[0]).toUpperCase();
    }

    return this.currentUser.username?.[0]?.toUpperCase() || 'U';
  }
}
