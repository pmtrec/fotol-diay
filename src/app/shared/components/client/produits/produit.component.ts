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

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.loadApprovedProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadApprovedProducts(): void {
    this.isLoading = true;

    this.productService.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (allProducts) => {
          // Filter only approved products for clients
          this.produits = allProducts.filter(p => p.status === 'approved');
          console.log('Produits approuvés trouvés:', this.produits.length);
          console.log('Exemple de produit:', this.produits[0]);

          // Debug image loading
          this.produits.forEach(p => {
            const mainImage = this.getMainImage(p.images || (p.images?.[0] ? [p.images?.[0]] : []));
            console.log(`Produit ${p.name}: image = ${mainImage}`);
          });

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des produits:', error);
          this.isLoading = false;
        }
      });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price) + ' F CFA';
  }

  getMainImage(images: string[] | string): string {
    // Handle both array of images and single imageUrl
    const imageArray = Array.isArray(images) ? images : [images].filter(Boolean);

    if (imageArray && imageArray.length > 0 && imageArray[0]) {
      return imageArray[0];
    }

    return 'assets/images/no-image.png';
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/no-image.png';
  }

  viewProduct(product: Produit): void {
    // Navigate to product detail page or open modal
    console.log('Viewing product:', product);
  }

  addToCart(product: Produit): void {
    // Add product to cart logic
    console.log('Adding to cart:', product);
  }

  contactSeller(product: Produit): void {
    // Contact seller logic
    console.log('Contacting seller for product:', product);
  }
}


