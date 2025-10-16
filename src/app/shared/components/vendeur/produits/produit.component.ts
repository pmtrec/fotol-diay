import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ProductService, Produit } from '../../../../core/services/product.service';

@Component({
  selector: 'app-produits',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './produit.component.html',
  styleUrls: ['./produit.component.scss'],
})
export class ProduitsComponent implements OnInit, OnDestroy {
  produits: Produit[] = [];
  isLoading = false;
  private destroy$ = new Subject<void>();

  // Current seller ID - should match the logged-in seller
  currentSellerId = 2; // TODO: Get from AuthService when implemented

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.loadSellerProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSellerProducts(): void {
    this.isLoading = true;

    this.productService.getProductsByVendeur(this.currentSellerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.produits = products;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des produits du vendeur:', error);
          this.isLoading = false;
        }
      });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price) + ' F CFA';
  }

  getMainImage(images: string[]): string {
    return images && images.length > 0 ? images[0] : 'assets/images/no-image.png';
  }

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

  getStatusIcon(statut: string): string {
    switch (statut) {
      case 'pending':
        return 'fa-clock';
      case 'approved':
        return 'fa-check-circle';
      case 'rejected':
        return 'fa-times-circle';
      default:
        return 'fa-question-circle';
    }
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/no-image.png';
  }

  editProduct(product: Produit): void {
    console.log('Editing product:', product);
    // Navigate to edit page or open modal
  }

  deleteProduct(product: Produit): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le produit "${product.name}" ?`)) {
      console.log('Deleting product:', product);
      // Delete product logic
    }
  }

  viewStats(product: Produit): void {
    console.log('Viewing stats for product:', product);
    // Show product statistics
  }

  addNewProduct(): void {
    console.log('Adding new product');
    // Navigate to add product page
  }
}
