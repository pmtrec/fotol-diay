import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { NavbarComponent } from '../../shared/components/vendeur/navbar/navbar.component';
import { SidebarComponent } from '../../shared/components/vendeur/sidebar/sidebar.component';
import { FooterComponent } from '../../shared/components/vendeur/footer/footer.component';
import { ProduitsComponent } from '../../shared/components/vendeur/produits/produit.component';

@Component({
  selector: 'app-vendeur-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
    ProduitsComponent
  ],
  templateUrl: './vendeur-layout.component.html',
  styleUrls: ['./vendeur-layout.component.scss']
})
export class VendeurLayoutComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  sidebarCollapsed = false;
  isMobile = false;
  showProduits = false;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    // S'abonner aux changements d'utilisateur
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;

        // Vérifier que l'utilisateur est un vendeur
        if (user && user.role !== 'seller') {
          this.router.navigate(['/error/404']);
        }
      });

    // Vérifier la route actuelle pour afficher les produits par défaut
    this.checkCurrentRoute();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?: any): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile && !this.sidebarCollapsed) {
      this.sidebarCollapsed = true;
    }
  }

  private checkCurrentRoute(): void {
    // Afficher les produits par défaut uniquement sur la route vendeur de base
    this.showProduits = this.router.url === '/vendeur' ||
                       this.router.url === '/vendeur/';
    // Ne pas afficher les produits sur la route dashboard - laisser router-outlet gérer
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  // Fermer la sidebar sur mobile quand on clique sur l'overlay
  closeSidebarOnMobile(): void {
    if (this.isMobile) {
      this.sidebarCollapsed = true;
    }
  }
}