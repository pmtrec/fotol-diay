import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product, ProductStatus } from '../../../core/models/product.model';

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

  recentProducts: Product[] = [];
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
      this.productService.getProductsBySeller(this.currentUser.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((products: Product[]) => {
          this.dashboardStats = {
            totalProducts: products.length,
            pendingProducts: products.filter(p => p.status === ProductStatus.PENDING).length,
            approvedProducts: products.filter(p => p.status === ProductStatus.APPROVED).length,
            rejectedProducts: products.filter(p => p.status === ProductStatus.REJECTED).length,
            totalValue: this.calculateTotalValue(products),
            lowStockProducts: this.calculateLowStockProducts(products)
          };

          // Récupérer les 5 derniers produits
          this.recentProducts = products
            .sort((a: Product, b: Product) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
        });
    }
  }

  private calculateTotalValue(products: Product[]): number {
    return products
      .filter(p => p.status === ProductStatus.APPROVED)
      .reduce((total, product) => total + (product.price * product.stock), 0);
  }

  private calculateLowStockProducts(products: Product[]): number {
    return products.filter(p => p.stock <= 5 && p.status === ProductStatus.APPROVED).length;
  }

  navigateToAddProduct(): void {
    // Navigation vers l'ajout de produit
    console.log('Navigation vers l\'ajout de produit');
  }

  navigateToProducts(): void {
    // Navigation vers la gestion des produits
    console.log('Navigation vers la gestion des produits');
  }

  getStatusLabel(status: ProductStatus): string {
    switch (status) {
      case ProductStatus.PENDING: return 'En Attente';
      case ProductStatus.APPROVED: return 'Approuvé';
      case ProductStatus.REJECTED: return 'Rejeté';
      default: return 'Inconnu';
    }
  }

  getStatusClass(status: ProductStatus): string {
    switch (status) {
      case ProductStatus.PENDING: return 'pending';
      case ProductStatus.APPROVED: return 'approved';
      case ProductStatus.REJECTED: return 'rejected';
      default: return 'unknown';
    }
  }
}