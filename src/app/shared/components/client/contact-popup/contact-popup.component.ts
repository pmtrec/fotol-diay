import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../../core/models/product.model';
import { User } from '../../../../core/models/user.model';
import { WhatsAppService } from '../../../../core/services/whatsapp.service';
import { Produit, ProductService } from '../../../../core/services/product.service';

@Component({
  selector: 'app-contact-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact-popup.component.html',
  styleUrls: ['./contact-popup.component.scss']
})
export class ContactPopupComponent {
  @Input() isVisible = false;
  @Input() product: Produit | null = null;
  @Input() seller: User | null = null;
  @Output() close = new EventEmitter<void>();

  constructor(private whatsAppService: WhatsAppService, private productService: ProductService) {}

  closePopup(): void {
    this.close.emit();
  }

  contactViaWhatsApp(): void {
    if (this.product && this.seller) {
      // Increment WhatsApp contact clicks
      this.incrementStatistic('whatsappClicks');

      // Convert Produit to Product for WhatsApp service
      const productForWhatsApp: Product = {
        id: this.product.id || '',
        name: this.product.name,
        description: this.product.description,
        price: this.product.price,
        images: Array.isArray(this.product.images) ? this.product.images : [this.product.images].filter(Boolean),
        category: this.product.category,
        stock: this.product.stock,
        status: this.product.status as any,
        sellerId: this.product.sellerId,
        createdAt: new Date(this.product.createdAt || ''),
        updatedAt: new Date(this.product.updatedAt || ''),
        rating: this.product.rating,
        validatedBy: this.product.validatedBy?.toString(),
        validatedAt: this.product.validatedAt ? new Date(this.product.validatedAt) : undefined,
        rejectionReason: this.product.rejectionReason,
        views: this.product.views || 0,
        contactClicks: this.product.contactClicks || 0,
        addToCartClicks: this.product.addToCartClicks || 0,
        whatsappClicks: this.product.whatsappClicks || 0
      };

      this.whatsAppService.contactSellerForProduct(productForWhatsApp, this.seller);
      this.closePopup();
    }
  }

  contactViaPhone(): void {
    if (this.seller?.phone) {
      // Increment contact clicks
      this.incrementStatistic('contactClicks');

      this.whatsAppService.callSeller(this.seller.phone);
      this.closePopup();
    }
  }

  get hasWhatsApp(): boolean {
    return !!(this.seller?.whatsapp);
  }

  get hasPhone(): boolean {
    return !!(this.seller?.phone);
  }

  get sellerDisplayName(): string {
    if (!this.seller) return 'Vendeur';

    if (this.seller.businessName) {
      return this.seller.businessName;
    }

    if (this.seller.firstName && this.seller.lastName) {
      return `${this.seller.firstName} ${this.seller.lastName}`;
    }

    return this.seller.username || 'Vendeur';
  }

  private incrementStatistic(statistic: keyof Pick<Produit, 'views' | 'contactClicks' | 'addToCartClicks' | 'whatsappClicks'>): void {
    if (!this.product?.id) return;

    const currentValue = this.product[statistic] || 0;
    const newValue = currentValue + 1;

    // Update local product object
    (this.product as any)[statistic] = newValue;

    // Update via API
    this.productService.updateProductStatistic(this.product.id, statistic, newValue)
      .subscribe({
        next: () => {
          console.log(`Statistic ${statistic} incremented for product ${this.product!.id}`);
        },
        error: (error: any) => {
          console.error(`Error incrementing statistic ${statistic} for product ${this.product!.id}:`, error);
          // Revert local change on error
          (this.product as any)[statistic] = currentValue;
        }
      });
  }
}
