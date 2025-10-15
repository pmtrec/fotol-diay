import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';
import { PubliciteComponent } from '../bandePublicite/publicite.component';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PubliciteComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
   // Propriétés pour la recherche
   searchQuery = '';
   showSearchSuggestions = false;
   searchSuggestions: string[] = [];

   // Propriétés pour les notifications
   notificationCount = 3;
   showUserMenu = false;

   // Propriétés utilisateur
   currentUser: User | null = null;
   userName = '';
   userVerified = false;
   showProfileDropdown = false;

   // Propriétés pour le menu mobile
   mobileMenuOpen = false;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // S'abonner aux changements d'utilisateur
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.updateUserData();
      });

    // Simuler des notifications (à remplacer par un vrai service)
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Méthodes de recherche
  onSearch(): void {
    if (this.searchQuery.trim()) {
      console.log('Recherche:', this.searchQuery);
      // Implémenter la logique de recherche admin
      // this.router.navigate(['/admin/search'], { queryParams: { q: this.searchQuery } });
    }
  }

  // Méthodes de notifications
  toggleNotifications(): void {
    console.log('Toggle notifications');
    // Implémenter l'ouverture du panneau de notifications
    this.notificationCount = 0; // Marquer comme lues
  }

  private loadNotifications(): void {
    // Simuler le chargement des notifications
    // À remplacer par un appel au service de notifications
    setTimeout(() => {
      this.notificationCount = Math.floor(Math.random() * 5) + 1;
    }, 1000);
  }

  // Méthodes d'actions rapides
  exportData(): void {
    console.log('Export des données');
    // Implémenter l'export des données admin
  }

  openSettings(): void {
    console.log('Ouvrir les paramètres');
    this.router.navigate(['/admin/settings']);
  }

  // Méthodes du menu utilisateur
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
    this.showUserMenu = false;
  }

  // Méthodes utilitaires pour l'affichage
  getUserDisplayName(): string {
    if (!this.currentUser) return 'Admin';

    if (this.currentUser.firstName && this.currentUser.lastName) {
      return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }

    return this.currentUser.username || 'Admin';
  }

  getUserRoleLabel(): string {
    if (!this.currentUser) return 'Administrateur';

    switch (this.currentUser.role) {
      case 'admin':
        return 'Administrateur';
      case 'seller':
        return 'Vendeur';
      case 'customer':
        return 'Client';
      default:
        return 'Utilisateur';
    }
  }

  // Méthode héritée pour compatibilité
  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  // Navigation methods
  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToNotifications(): void {
    this.toggleNotifications();
    this.router.navigate(['/admin/notifications']);
  }

  goToAddProduct(): void {
    this.router.navigate(['/admin/products/add']);
  }

  goToBoost(): void {
    this.router.navigate(['/admin/boost']);
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  goToProfile(): void {
    this.router.navigate(['/admin/profile']);
    this.showProfileDropdown = false;
  }

  goToSubscription(): void {
    this.router.navigate(['/admin/subscription']);
    this.showProfileDropdown = false;
  }

  goToSettings(): void {
    this.router.navigate(['/admin/settings']);
    this.showProfileDropdown = false;
  }

  goToWhatsApp(): void {
    window.open('https://wa.me/your-number', '_blank');
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  // Update user data when currentUser changes
  private updateUserData(): void {
    if (this.currentUser) {
      this.userName = this.getUserDisplayName();
      this.userVerified = this.currentUser.isActive || false; // Use isActive as verified status
    }
  }
}
