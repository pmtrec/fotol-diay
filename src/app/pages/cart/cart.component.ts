import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { Cart, CartItem } from '../../core/models/cart.model';
import { WhatsAppService } from '../../core/services/whatsapp.service';
import { SellerService } from '../../core/services/seller.service';
import { User } from '../../core/models/user.model';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit, OnDestroy {
  cart: Cart = { items: [], total: 0, itemCount: 0 };
  private destroy$ = new Subject<void>();
  sellers: { [sellerId: string]: User } = {}; // Cache des vendeurs

  constructor(
    private cartService: CartService,
    private whatsAppService: WhatsAppService,
    private sellerService: SellerService
  ) {}

  ngOnInit(): void {
    this.cartService.getCart()
      .pipe(takeUntil(this.destroy$))
      .subscribe(cart => {
        this.cart = cart;
        this.loadSellersInfo();
      });
  }

  private loadSellersInfo(): void {
    // Get unique seller IDs from cart items
    const sellerIds = [...new Set(this.cart.items.map(item => item.product.sellerId))];

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    if (newQuantity < 1) {
      this.removeFromCart(item.product.id);
    } else {
      this.cartService.updateQuantity(item.product.id, newQuantity);
    }
  }

  removeFromCart(productId: string): void {
    this.cartService.removeFromCart(productId);
  }

  clearCart(): void {
    if (confirm('Êtes-vous sûr de vouloir vider le panier ?')) {
      this.cartService.clearCart();
    }
  }

  getTotalForItem(item: CartItem): number {
    return item.product.price * item.quantity;
  }

  getSellerInfo(sellerId: string): User | null {
    return this.sellers[sellerId] || null;
  }

  getSellerDisplayName(sellerId: string): string {
    const seller = this.sellers[sellerId];
    if (!seller) return `Inconnu`;

    if (seller.firstName) {
      return seller.firstName;
    }

    if (seller.businessName) {
      return seller.businessName;
    }

    return seller.username || `Inconnu`;
  }

  contactSeller(sellerId: string): void {
    const seller = this.sellers[sellerId];
    if (!seller) {
      console.error('Informations du vendeur non disponibles');
      return;
    }

    // Filter cart items for this specific seller
    const sellerCartItems = this.cart.items.filter(item => item.product.sellerId === sellerId);

    if (sellerCartItems.length === 0) {
      console.error('Aucun produit de ce vendeur dans le panier');
      return;
    }

    // Convert cart items to products for WhatsApp service
    const sellerProducts: Product[] = sellerCartItems.map(cartItem => ({
      id: cartItem.product.id,
      name: cartItem.product.name,
      description: cartItem.product.description,
      price: cartItem.product.price,
      images: Array.isArray(cartItem.product.images) ? cartItem.product.images : [cartItem.product.images].filter(Boolean),
      category: cartItem.product.category,
      stock: cartItem.product.stock,
      status: cartItem.product.status as any,
      sellerId: cartItem.product.sellerId,
      createdAt: new Date(cartItem.product.createdAt || ''),
      updatedAt: new Date(cartItem.product.updatedAt || ''),
      rating: cartItem.product.rating,
      validatedBy: cartItem.product.validatedBy,
      validatedAt: cartItem.product.validatedAt ? new Date(cartItem.product.validatedAt) : undefined,
      rejectionReason: cartItem.product.rejectionReason,
      views: cartItem.product.views || 0,
      contactClicks: cartItem.product.contactClicks || 0,
      addToCartClicks: cartItem.product.addToCartClicks || 0,
      whatsappClicks: cartItem.product.whatsappClicks || 0
    }));

    // Create a cart object for this seller's products
    const sellerCart = {
      items: sellerCartItems,
      total: sellerProducts.reduce((sum, product, index) => sum + (product.price * sellerCartItems[index].quantity), 0),
      itemCount: sellerCartItems.reduce((sum, item) => sum + item.quantity, 0)
    };

    this.whatsAppService.contactSellerForCart(sellerCart, seller);
  }

  getUniqueSellers(): string[] {
    return [...new Set(this.cart.items.map(item => item.product.sellerId))];
  }
}