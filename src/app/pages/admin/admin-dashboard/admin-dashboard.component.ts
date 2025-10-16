import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductService, Produit } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-vendeur-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class VendeurDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  dashboardStats = {
    totalProducts: 0,
    pendingProducts: 0,
    approvedProducts: 0,
    rejectedProducts: 0,
    totalValue: 0,
    lowStockProducts: 0
  };

  recentProducts: Produit[] = [];
  currentUser: any;

  constructor(
    private productService: ProductService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    if (this.currentUser) {
      // Charger les produits du vendeur
      this.productService.getProductsByVendeur(this.currentUser.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((products: Produit[]) => {
          this.dashboardStats = {
            totalProducts: products.length,
            pendingProducts: products.filter(p => p.status === 'pending').length,
            approvedProducts: products.filter(p => p.status === 'approved').length,
            rejectedProducts: products.filter(p => p.status === 'rejected').length,
            totalValue: this.calculateTotalValue(products),
            lowStockProducts: this.calculateLowStockProducts(products)
          };

          // Récupérer les 5 derniers produits
          this.recentProducts = products
            .sort((a: Produit, b: Produit) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
            .slice(0, 5);
        });
    }
  }

  private calculateTotalValue(products: Produit[]): number {
    return products
      .filter(p => p.status === 'approved')
      .reduce((total, product) => total + (product.price * product.stock), 0);
  }

  private calculateLowStockProducts(products: Produit[]): number {
    return products.filter(p => p.stock <= 5 && p.status === 'approved').length;
  }

  navigateToAddProduct(): void {
    // Navigation vers l'ajout de produit
    console.log('Navigation vers l\'ajout de produit');
  }

  navigateToProducts(): void {
    // Navigation vers la gestion des produits
    console.log('Navigation vers la gestion des produits');
  }

  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'pending': return 'En Attente';
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      default: return 'Inconnu';
    }
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'pending': return 'pending';
      case 'approved': return 'approved';
      case 'rejected': return 'rejected';
      default: return 'unknown';
    }
  }
}