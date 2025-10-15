import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { UserService } from '../../../core/services/user.service';
import { Product, ProductStatus } from '../../../core/models/product.model';

@Component({
  selector: 'app-vendeur-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vendeur-dashboard.component.html',
  styleUrl: './vendeur-dashboard.component.scss'
})
export class VendeurDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Products and filtering
  products: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading = false;
  currentFilter: 'all' | 'pending' | 'approved' | 'rejected' = 'pending'; // Default to pending (non-approved)

  // Current seller ID (mock for now, should come from user service)
  currentSellerId = 1; // TODO: Get from UserService when implemented

  constructor(
    private router: Router,
    private productService: ProductService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadSellerProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateToAddProduct(): void {
    this.router.navigate(['/vendeur/add-product']);
  }

  navigateToProducts(): void {
    this.router.navigate(['/vendeur/products']);
  }

  // Load products for current seller
  private loadSellerProducts(): void {
    this.isLoading = true;

    // Get products by seller
    this.productService.getProductsBySeller(this.currentSellerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products = products;
          this.applyFilter();
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement des produits:', error);
          this.isLoading = false;
        }
      });
  }

  // Apply filter to products
  private applyFilter(): void {
    switch (this.currentFilter) {
      case 'pending':
        this.filteredProducts = this.products.filter(p => p.status === ProductStatus.PENDING);
        break;
      case 'approved':
        this.filteredProducts = this.products.filter(p => p.status === ProductStatus.APPROVED);
        break;
      case 'rejected':
        this.filteredProducts = this.products.filter(p => p.status === ProductStatus.REJECTED);
        break;
      default:
        this.filteredProducts = this.products;
    }
  }

  // Filter methods for buttons
  showAllProducts(): void {
    this.currentFilter = 'all';
    this.applyFilter();
  }

  showPendingProducts(): void {
    this.currentFilter = 'pending';
    this.applyFilter();
  }

  showApprovedProducts(): void {
    this.currentFilter = 'approved';
    this.applyFilter();
  }

  showRejectedProducts(): void {
    this.currentFilter = 'rejected';
    this.applyFilter();
  }

  // Get status label in French
  getStatusLabel(status: ProductStatus): string {
    switch (status) {
      case ProductStatus.PENDING:
        return 'En attente';
      case ProductStatus.APPROVED:
        return 'Approuvé';
      case ProductStatus.REJECTED:
        return 'Rejeté';
      default:
        return 'Inconnu';
    }
  }

  // Get status CSS class
  getStatusClass(status: ProductStatus): string {
    switch (status) {
      case ProductStatus.PENDING:
        return 'status-pending';
      case ProductStatus.APPROVED:
        return 'status-approved';
      case ProductStatus.REJECTED:
        return 'status-rejected';
      default:
        return '';
    }
  }

  // Get product counts for each status
  getPendingCount(): number {
    return this.products.filter(p => p.status === ProductStatus.PENDING).length;
  }

  getApprovedCount(): number {
    return this.products.filter(p => p.status === ProductStatus.APPROVED).length;
  }

  getRejectedCount(): number {
    return this.products.filter(p => p.status === ProductStatus.REJECTED).length;
  }

  // Product management methods
  editProduct(productId: number): void {
    this.router.navigate(['/vendeur/edit-product', productId]);
  }

  deleteProduct(productId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      this.productService.deleteProduct(productId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Product will be automatically removed from the list via the BehaviorSubject
            console.log('Produit supprimé avec succès');
          },
          error: (error: any) => {
            console.error('Erreur lors de la suppression du produit:', error);
          }
        });
    }
  }
}