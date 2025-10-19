import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductService, Produit } from '../../../core/services/product.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationModalComponent } from '../../../shared/components/common/confirmation-modal/confirmation-modal.component';

interface SellerStats {
  totalProducts: number;
  pendingProducts: number;
  approvedProducts: number;
  rejectedProducts: number;
  totalValue: number;
  lowStockProducts: number;
  totalViews: number;
  totalContactClicks: number;
  totalAddToCartClicks: number;
  totalWhatsappClicks: number;
}

@Component({
  selector: 'app-vendeur-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterModule, ConfirmationModalComponent],
  templateUrl: './vendeur-dashboard.component.html',
  styleUrl: './vendeur-dashboard.component.scss'
})
export class VendeurDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Products and filtering
  products: Produit[] = [];
  filteredProducts: Produit[] = [];
  isLoading = false;
  currentFilter: 'all' | 'pending' | 'approved' | 'rejected' = 'all';

  // Seller statistics
  sellerStats: SellerStats = {
    totalProducts: 0,
    pendingProducts: 0,
    approvedProducts: 0,
    rejectedProducts: 0,
    totalValue: 0,
    lowStockProducts: 0,
    totalViews: 0,
    totalContactClicks: 0,
    totalAddToCartClicks: 0,
    totalWhatsappClicks: 0
  };

  // Current seller ID - gets from logged-in user
  get currentSellerId(): string {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.role === 'seller' ? currentUser.id : '2'; // fallback to '2' if not seller
  }

  // Modal properties
  showDeleteModal = false;
  productToDelete: Produit | null = null;

  constructor(
    private router: Router,
    private productService: ProductService,
    private userService: UserService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadSellerProducts();
  }

  private calculateSellerStats(products: Produit[]): void {
    this.sellerStats = {
      totalProducts: products.length,
      pendingProducts: products.filter(p => p.status === 'pending').length,
      approvedProducts: products.filter(p => p.status === 'approved').length,
      rejectedProducts: products.filter(p => p.status === 'rejected').length,
      totalValue: this.calculateTotalValue(products),
      lowStockProducts: this.calculateLowStockProducts(products),
      totalViews: this.calculateTotalStatistic(products, 'views'),
      totalContactClicks: this.calculateTotalStatistic(products, 'contactClicks'),
      totalAddToCartClicks: this.calculateTotalStatistic(products, 'addToCartClicks'),
      totalWhatsappClicks: this.calculateTotalStatistic(products, 'whatsappClicks')
    };
  }

  private calculateTotalValue(products: Produit[]): number {
    return products
      .filter(p => p.status === 'approved')
      .reduce((total, product) => total + (product.price * product.stock), 0);
  }

  private calculateLowStockProducts(products: Produit[]): number {
    return products.filter(p => p.stock <= 5 && p.status === 'approved').length;
  }

  private calculateTotalStatistic(products: Produit[], statistic: keyof Pick<Produit, 'views' | 'contactClicks' | 'addToCartClicks' | 'whatsappClicks'>): number {
    return products.reduce((total, product) => total + (product[statistic] || 0), 0);
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
    this.productService.getProductsByVendeur(this.currentSellerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products = products;
          this.calculateSellerStats(products);
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
        this.filteredProducts = this.products.filter(p => p.status === 'pending');
        break;
      case 'approved':
        this.filteredProducts = this.products.filter(p => p.status === 'approved');
        break;
      case 'rejected':
        this.filteredProducts = this.products.filter(p => p.status === 'rejected');
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
  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'pending':
        return 'En attente';
      case 'approved':
        return 'Approuvé';
      case 'rejected':
        return 'Rejeté';
      default:
        return 'Inconnu';
    }
  }

  // Get status CSS class
  getStatusClass(statut: string): string {
    switch (statut) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return '';
    }
  }

  // Get product counts for each status
  getPendingCount(): number {
    return this.products.filter(p => p.status === 'pending').length;
  }

  getApprovedCount(): number {
    return this.products.filter(p => p.status === 'approved').length;
  }

  getRejectedCount(): number {
    return this.products.filter(p => p.status === 'rejected').length;
  }

  // Product management methods
  editProduct(productId: number | undefined): void {
    if (productId === undefined || productId === null || isNaN(productId)) {
      console.error('Erreur: ID du produit manquant ou invalide', productId);
      this.notificationService.showNotification('Erreur: ID du produit invalide', 'error');
      return;
    }
    this.router.navigate(['/vendeur/products/edit', productId.toString()]);
  }

  deleteProduct(productId: number | undefined): void {
    if (productId === undefined || productId === null || isNaN(productId)) {
      console.error('Erreur: ID du produit manquant ou invalide', productId);
      this.notificationService.showNotification('Erreur: ID du produit invalide', 'error');
      return;
    }

    // Find the product to delete
    const product = this.products.find(p => p.id === productId.toString());
    if (product) {
      this.productToDelete = product;
      this.showDeleteModal = true;
    } else {
      this.notificationService.showNotification('Produit non trouvé', 'error');
    }
  }

  confirmDeleteProduct(): void {
    if (this.productToDelete && this.productToDelete.id) {
      this.productService.deleteProduct(this.productToDelete.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Product will be automatically removed from the list via the BehaviorSubject
            console.log('Produit supprimé avec succès');
            this.closeDeleteModal();
          },
          error: (error: any) => {
            console.error('Erreur lors de la suppression du produit:', error);
            this.closeDeleteModal();
          }
        });
    }
  }

  cancelDeleteProduct(): void {
    this.closeDeleteModal();
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.productToDelete = null;
  }

  // Show product statistics (placeholder method)
  showProductStats(product: Produit): void {
    // TODO: Implement product statistics modal or navigation
    const statsMessage = `
Statistiques du produit: ${product.name}

- Vues: ${product.views || 0}
- Clics contact: ${product.contactClicks || 0}
- Ajouts au panier: ${product.addToCartClicks || 0}
- Clics WhatsApp: ${product.whatsappClicks || 0}
- Stock actuel: ${product.stock}
- Prix: ${product.price} FCFA
    `.trim();

    this.notificationService.showNotification(statsMessage, 'info', 'Statistiques du produit');
  }

  // Get CSS class for category badge
  getCategoryClass(category: string): string {
    // Handle special characters and spaces in category names
    switch (category.toLowerCase()) {
      case 'électronique':
        return 'électronique';
      case 'maison & jardin':
        return 'maison-jardin';
      case 'alwar':
        return 'alwar';
      case 'mode':
        return 'mode';
      case 'livres':
        return 'livres';
      case 'sports & loisirs':
        return 'sports-loisirs';
      default:
        return category.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }
  }
}