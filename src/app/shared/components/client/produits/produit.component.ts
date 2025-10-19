import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ProductService, Produit } from '../../../../core/services/product.service';
import { WhatsAppService } from '../../../../core/services/whatsapp.service';
import { SellerService } from '../../../../core/services/seller.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { User } from '../../../../core/models/user.model';
import { Product } from '../../../../core/models/product.model';
import { ContactPopupComponent } from '../contact-popup/contact-popup.component';

@Component({
  selector: 'app-produits',
  standalone: true,
  imports: [CommonModule, ContactPopupComponent],
  templateUrl: './produit.component.html',
  styleUrls: ['./produit.component.scss'],
})
export class ProduitsComponent implements OnInit, OnDestroy, OnChanges {
  produits: Produit[] = [];
  produitsFiltres: Produit[] = [];
  isLoading = false;
  private destroy$ = new Subject<void>();
  sellers: { [sellerId: string]: User } = {}; // Cache des vendeurs

  @Input() selectedCategories: string[] = [];

  // Popup state
  showContactPopup = false;
  selectedProductForContact: Produit | null = null;

  constructor(
    private productService: ProductService,
    private whatsAppService: WhatsAppService,
    private sellerService: SellerService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadApprovedProducts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedCategories']) {
      this.filterProducts();
    }
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

          // Load seller information for each product
          this.loadSellersInfo();

          // Apply initial filtering
          this.filterProducts();

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des produits:', error);
          this.isLoading = false;
        }
      });
  }

  private filterProducts(): void {
    if (!this.selectedCategories || this.selectedCategories.length === 0) {
      this.produitsFiltres = this.produits;
    } else {
      this.produitsFiltres = this.produits.filter(produit =>
        this.selectedCategories.some(selectedCat =>
          produit.category.toLowerCase() === selectedCat.toLowerCase()
        )
      );
    }
  }

  private loadSellersInfo(): void {
    // Get unique seller IDs
    const sellerIds = [...new Set(this.produits.map(p => p.sellerId))];

    sellerIds.forEach(sellerId => {
      if (!this.sellers[sellerId]) {
        this.sellerService.getSellerById(sellerId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (seller) => {
              this.sellers[sellerId] = seller;
            },
            error: (error) => {
              console.error(`Erreur lors du chargement du vendeur ${sellerId}:`, error);
            }
          });
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
    // Increment view count
    this.incrementStatistic(product, 'views');
    // Navigate to product detail page or open modal
    console.log('Viewing product:', product);
  }

  addToCart(product: Produit): void {
    // Increment add to cart count
    this.incrementStatistic(product, 'addToCartClicks');
    // Add product to cart logic
    console.log('Adding to cart:', product);
  }

  contactSeller(product: Produit): void {
    const seller = this.sellers[product.sellerId];

    if (!seller) {
      console.log('Informations du vendeur non disponibles, chargement en cours...');
      // Try to load seller info specifically for this product
      this.loadSellerInfoForProduct(product.sellerId, product);
      return;
    }

    this.selectedProductForContact = product;
    this.showContactPopup = true;
  }

  private loadSellerInfoForProduct(sellerId: string, product: Produit): void {
    if (this.sellers[sellerId]) {
      // Already loaded
      this.selectedProductForContact = product;
      this.showContactPopup = true;
      return;
    }

    this.sellerService.getSellerById(sellerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (seller) => {
          this.sellers[sellerId] = seller;
          this.selectedProductForContact = product;
          this.showContactPopup = true;
        },
        error: (error) => {
          console.error(`Erreur lors du chargement du vendeur ${sellerId}:`, error);
          this.notificationService.showNotification(
            'Impossible de charger les informations du vendeur. Veuillez réessayer.',
            'error'
          );
        }
      });
  }

  closeContactPopup(): void {
    this.showContactPopup = false;
    this.selectedProductForContact = null;
  }

  getSellerInfo(sellerId: string): User | null {
    return this.sellers[sellerId] || null;
  }

  getSellerDisplayName(sellerId: string): string {
    const seller = this.sellers[sellerId];
    if (!seller) return `Vendeur`;

    if (seller.firstName) {
      return seller.firstName;
    }

    if (seller.businessName) {
      return seller.businessName;
    }

    return seller.username || `Vendeur`;
  }

  isLoadingSeller(sellerId: string): boolean {
    return !this.sellers[sellerId];
  }

  private incrementStatistic(product: Produit, statistic: keyof Pick<Produit, 'views' | 'contactClicks' | 'addToCartClicks' | 'whatsappClicks'>): void {
    const productId = product.id;
    if (!productId) return;

    // Get current value or default to 0
    const currentValue = product[statistic] || 0;
    const newValue = currentValue + 1;

    // Update the product object locally
    (product as any)[statistic] = newValue;

    // Update via API
    this.productService.updateProductStatistic(productId, statistic, newValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log(`Statistic ${statistic} incremented for product ${productId}`);
        },
        error: (error) => {
          console.error(`Error incrementing statistic ${statistic} for product ${productId}:`, error);
          // Revert local change on error
          (product as any)[statistic] = currentValue;
        }
      });
  }
}


