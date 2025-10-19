import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  Order,
  OrderStatus,
  OrderFilters,
  OrderStats,
  CreateOrderRequest,
  OrderItem,
  PaymentInfo,
  PaymentStatus,
  PaymentMethod
} from '../models/order.model';
import { CartItem } from '../models/cart.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly STORAGE_KEY = 'orders';
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  private ordersStatsSubject = new BehaviorSubject<OrderStats | null>(null);

  public orders$ = this.ordersSubject.asObservable();
  public ordersStats$ = this.ordersStatsSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadOrders();
  }

  // =================== COMMANDES ===================

  /**
   * Créer une nouvelle commande depuis le panier
   */
  createOrderFromCart(cartItems: CartItem[], customerInfo: any, shippingInfo: any, paymentInfo: any): Observable<Order> {
    const orderRequest: CreateOrderRequest = {
      customerInfo,
      items: cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      })),
      shipping: shippingInfo,
      payment: paymentInfo
    };

    return this.apiService.post<Order>('/orders', orderRequest).pipe(
      tap(order => {
        this.refreshOrders();
        this.updateOrderStats();
      })
    );
  }

  /**
   * Récupérer toutes les commandes avec filtres
   */
  getOrders(filters?: OrderFilters): Observable<Order[]> {
    let params = '';
    if (filters) {
      const searchParams = new URLSearchParams();
      if (filters.status?.length) searchParams.append('status', filters.status.join(','));
      if (filters.customerId) searchParams.append('customerId', filters.customerId);
      if (filters.sellerId) searchParams.append('sellerId', filters.sellerId);
      if (filters.dateFrom) searchParams.append('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) searchParams.append('dateTo', filters.dateTo.toISOString());
      if (filters.minAmount) searchParams.append('minAmount', filters.minAmount.toString());
      if (filters.maxAmount) searchParams.append('maxAmount', filters.maxAmount.toString());
      if (filters.search) searchParams.append('search', filters.search);
      params = '?' + searchParams.toString();
    }

    return this.apiService.get<Order[]>(`/orders${params}`);
  }

  /**
   * Récupérer une commande par son ID
   */
  getOrderById(id: number): Observable<Order> {
    return this.apiService.get<Order>(`/orders/${id}`);
  }

  /**
   * Récupérer les commandes d'un client
   */
  getOrdersByCustomer(customerId: string): Observable<Order[]> {
    return this.apiService.get<Order[]>(`/orders?customerId=${customerId}`);
  }

  /**
   * Récupérer les commandes d'un vendeur
   */
  getOrdersBySeller(sellerId: string): Observable<Order[]> {
    return this.apiService.get<Order[]>(`/orders?sellerId=${sellerId}`);
  }

  /**
   * Mettre à jour le statut d'une commande
   */
  updateOrderStatus(orderId: number, status: OrderStatus, notes?: string): Observable<Order> {
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (notes) updateData.notes = notes;

    // Dates spécifiques selon le statut
    switch (status) {
      case OrderStatus.SHIPPED:
        updateData.shippedAt = new Date().toISOString();
        break;
      case OrderStatus.DELIVERED:
        updateData.deliveredAt = new Date().toISOString();
        break;
      case OrderStatus.CANCELLED:
        updateData.cancelledAt = new Date().toISOString();
        if (notes) updateData.cancellationReason = notes;
        break;
    }

    return this.apiService.patch<Order>(`/orders/${orderId}`, updateData).pipe(
      tap(order => {
        this.refreshOrders();
        this.updateOrderStats();
      })
    );
  }

  /**
   * Mettre à jour le statut d'un item de commande
   */
  updateOrderItemStatus(orderId: number, itemId: number, status: string): Observable<Order> {
    return this.apiService.patch<Order>(`/orders/${orderId}/items/${itemId}`, {
      status,
      updatedAt: new Date().toISOString()
    }).pipe(
      tap(order => {
        this.refreshOrders();
      })
    );
  }

  /**
   * Annuler une commande
   */
  cancelOrder(orderId: number, reason: string): Observable<Order> {
    return this.updateOrderStatus(orderId, OrderStatus.CANCELLED, reason);
  }

  /**
   * Marquer une commande comme livrée
   */
  markAsDelivered(orderId: number): Observable<Order> {
    return this.updateOrderStatus(orderId, OrderStatus.DELIVERED);
  }

  /**
   * Mettre à jour les informations de paiement
   */
  updatePaymentInfo(orderId: number, paymentInfo: Partial<PaymentInfo>): Observable<Order> {
    return this.apiService.patch<Order>(`/orders/${orderId}/payment`, {
      ...paymentInfo,
      updatedAt: new Date().toISOString()
    }).pipe(
      tap(order => {
        this.refreshOrders();
      })
    );
  }

  /**
   * Mettre à jour les informations de livraison
   */
  updateShippingInfo(orderId: number, shippingInfo: any): Observable<Order> {
    return this.apiService.patch<Order>(`/orders/${orderId}/shipping`, {
      ...shippingInfo,
      updatedAt: new Date().toISOString()
    }).pipe(
      tap(order => {
        this.refreshOrders();
      })
    );
  }

  /**
   * Supprimer une commande (admin seulement)
   */
  deleteOrder(orderId: number): Observable<void> {
    return this.apiService.delete<void>(`/orders/${orderId}`).pipe(
      tap(() => {
        this.refreshOrders();
        this.updateOrderStats();
      })
    );
  }

  // =================== STATISTIQUES ===================

  /**
   * Récupérer les statistiques des commandes
   */
  getOrderStats(filters?: { sellerId?: string; dateFrom?: Date; dateTo?: Date }): Observable<OrderStats> {
    let params = '';
    if (filters) {
      const searchParams = new URLSearchParams();
      if (filters.sellerId) searchParams.append('sellerId', filters.sellerId);
      if (filters.dateFrom) searchParams.append('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) searchParams.append('dateTo', filters.dateTo.toISOString());
      params = '?' + searchParams.toString();
    }

    return this.apiService.get<OrderStats>(`/orders/stats${params}`);
  }

  /**
   * Récupérer les commandes récentes
   */
  getRecentOrders(limit: number = 10): Observable<Order[]> {
    return this.apiService.get<Order[]>(`/orders/recent?limit=${limit}`);
  }

  /**
   * Récupérer les commandes en attente de traitement
   */
  getPendingOrders(sellerId?: string): Observable<Order[]> {
    const filter = sellerId ? `?sellerId=${sellerId}&status=paid,processing` : '?status=paid,processing';
    return this.apiService.get<Order[]>(`/orders${filter}`);
  }

  // =================== FONCTIONS PRIVÉES ===================

  private loadOrders(): void {
    this.apiService.get<Order[]>('/orders').subscribe({
      next: (orders) => {
        this.ordersSubject.next(orders);
        this.updateOrderStats();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des commandes:', error);
        this.ordersSubject.next([]);
      }
    });
  }

  private refreshOrders(): void {
    this.loadOrders();
  }

  private updateOrderStats(): void {
    this.getOrderStats().subscribe(stats => {
      this.ordersStatsSubject.next(stats);
    });
  }

  // =================== FONCTIONS DE COMPATIBILITÉ ===================

  /**
   * Générer un numéro de commande unique
   */
  generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `KL${timestamp}${random}`;
  }

  /**
   * Calculer le total d'une commande
   */
  calculateOrderTotal(items: OrderItem[], shippingCost: number = 0, tax: number = 0): number {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    return subtotal + shippingCost + tax;
  }

  /**
   * Valider une commande avant création
   */
  validateOrder(orderRequest: CreateOrderRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!orderRequest.customerInfo.email) {
      errors.push('Email du client requis');
    }

    if (!orderRequest.customerInfo.phone) {
      errors.push('Téléphone du client requis');
    }

    if (!orderRequest.items.length) {
      errors.push('Au moins un produit requis');
    }

    if (!orderRequest.shipping.address.street) {
      errors.push('Adresse de livraison requise');
    }

    if (!orderRequest.payment.method) {
      errors.push('Méthode de paiement requise');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Formater le statut pour l'affichage
   */
  getStatusLabel(status: OrderStatus): string {
    const labels = {
      [OrderStatus.PENDING]: 'En attente de paiement',
      [OrderStatus.PAID]: 'Payée',
      [OrderStatus.PROCESSING]: 'En cours de traitement',
      [OrderStatus.SHIPPED]: 'Expédiée',
      [OrderStatus.DELIVERED]: 'Livrée',
      [OrderStatus.CANCELLED]: 'Annulée',
      [OrderStatus.REFUNDED]: 'Remboursée'
    };
    return labels[status] || status;
  }

  /**
   * Obtenir la classe CSS pour le statut
   */
  getStatusClass(status: OrderStatus): string {
    const classes = {
      [OrderStatus.PENDING]: 'status-pending',
      [OrderStatus.PAID]: 'status-paid',
      [OrderStatus.PROCESSING]: 'status-processing',
      [OrderStatus.SHIPPED]: 'status-shipped',
      [OrderStatus.DELIVERED]: 'status-delivered',
      [OrderStatus.CANCELLED]: 'status-cancelled',
      [OrderStatus.REFUNDED]: 'status-refunded'
    };
    return classes[status] || '';
  }

  /**
   * Vérifier si une commande peut être modifiée
   */
  canModifyOrder(order: Order): boolean {
    return [OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PROCESSING].includes(order.status);
  }

  /**
   * Vérifier si une commande peut être annulée
   */
  canCancelOrder(order: Order): boolean {
    return [OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PROCESSING].includes(order.status);
  }
}