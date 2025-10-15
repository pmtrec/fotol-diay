import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PubliciteComponent } from '../bandePublicite/publicite.component';
import { CartService } from '../../../../core/services/cart.service';
import { Cart } from '../../../../core/models/cart.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, PubliciteComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  cartItemCount = 0;
  userName = 'Kasongo Vendeur'; // Nom du vendeur
  userVerified = true;          // Affiche le badge vérifié
  notificationCount = 5;        // Nombre de notifications
  showProfileDropdown = false;  // Pour le dropdown profil
  showSearchSuggestions = false; // Pour les suggestions de recherche
  searchSuggestions: string[] = [
    'iPhone 15 Pro Max',
    'Samsung Galaxy S24',
    'MacBook Air M3',
    'PlayStation 5',
    'Casque Bluetooth'
  ];

  private destroy$ = new Subject<void>();

  constructor(private cartService: CartService, private router: Router) {}

  ngOnInit(): void {
    // Abonnement au panier
    this.cartService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe((cart: Cart) => {
        this.cartItemCount = cart.items.length;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // 🔍 Recherche
  onSearch(): void {
    console.log('Recherche effectuée');
    // Implémenter la logique de recherche ici
  }

  // 🔹 Navigation
  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  goToProfile(): void {
    this.router.navigate(['/vendeur/profile']);
    this.showProfileDropdown = false;
  }

  goToAddProduct(): void {
    this.router.navigate(['/vendeur/products/add']);
  }

  goToHome(): void {
    this.router.navigate(['/vendeur/home']);
  }

  goToNotifications(): void {
    this.router.navigate(['/vendeur/notifications']);
  }

  goToBoost(): void {
    this.router.navigate(['/vendeur/boost']);
  }

  goToSettings(): void {
    this.router.navigate(['/vendeur/settings']);
    this.showProfileDropdown = false;
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  toggleMobileMenu(): void {
    // Émettre un événement pour que le layout parent gère le menu mobile
    console.log('Toggle mobile menu');
  }

  goToSubscription(): void {
    this.router.navigate(['/vendeur/subscription']);
    this.showProfileDropdown = false;
  }

  logout(): void {
    // Ici tu peux ajouter ton service d'authentification pour logout
    console.log('Déconnexion...');
    this.showProfileDropdown = false;
    this.router.navigate(['/login']);
  }

  goToWhatsApp(): void {
    // Redirection vers WhatsApp ou page de chat
    window.open('https://wa.me/1234567890', '_blank');
  }

  // Fermer le dropdown quand on clique en dehors
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-container')) {
      this.showProfileDropdown = false;
    }
    if (!target.closest('.search-container')) {
      this.showSearchSuggestions = false;
    }
  }
}
