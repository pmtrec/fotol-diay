import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Cart, CartItem } from '../models/cart.model';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartSubject = new BehaviorSubject<Cart>({ items: [], total: 0, itemCount: 0 });
  public cart$ = this.cartSubject.asObservable();

  constructor() {
    this.loadCartFromStorage();
  }

  private loadCartFromStorage(): void {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      this.cartSubject.next(cart);
    }
  }

  private saveCartToStorage(cart: Cart): void {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  getCart(): Observable<Cart> {
    return this.cart$;
  }

  addToCart(product: Product, quantity: number = 1): void {
    const currentCart = this.cartSubject.value;
    const existingItemIndex = currentCart.items.findIndex(item => item.product.id === product.id);

    let updatedItems: CartItem[];

    if (existingItemIndex > -1) {
      // Update existing item quantity
      updatedItems = [...currentCart.items];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity
      };
    } else {
      // Add new item
      updatedItems = [...currentCart.items, { product, quantity }];
    }

    const updatedCart = this.calculateCartTotals(updatedItems);
    this.cartSubject.next(updatedCart);
    this.saveCartToStorage(updatedCart);
  }

  removeFromCart(productId: number): void {
    const currentCart = this.cartSubject.value;
    const updatedItems = currentCart.items.filter(item => item.product.id !== productId);
    const updatedCart = this.calculateCartTotals(updatedItems);
    this.cartSubject.next(updatedCart);
    this.saveCartToStorage(updatedCart);
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const currentCart = this.cartSubject.value;
    const updatedItems = currentCart.items.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    const updatedCart = this.calculateCartTotals(updatedItems);
    this.cartSubject.next(updatedCart);
    this.saveCartToStorage(updatedCart);
  }

  clearCart(): void {
    const emptyCart: Cart = { items: [], total: 0, itemCount: 0 };
    this.cartSubject.next(emptyCart);
    this.saveCartToStorage(emptyCart);
  }

  private calculateCartTotals(items: CartItem[]): Cart {
    const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);

    return {
      items,
      total,
      itemCount
    };
  }
}