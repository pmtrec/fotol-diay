import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { OrderService } from '../../core/services/order.service';
import { NotificationService } from '../../core/services/notification.service';
import { Order, OrderStatus } from '../../core/models/order.model';
import { NotificationType, NotificationPriority, NotificationCategory } from '../../core/models/notification.model';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './order-tracking.component.html',
  styleUrls: ['./order-tracking.component.scss']
})
export class OrderTrackingComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  order: Order | null = null;
  loading = false;
  error = '';
  orderNumber = '';

  // Tracking steps
  trackingSteps = [
    {
      status: OrderStatus.PENDING,
      label: 'Commande reçue',
      description: 'Votre commande a été reçue et est en attente de traitement',
      icon: 'fa-solid fa-shopping-cart',
      completed: false,
      current: false
    },
    {
      status: OrderStatus.PAID,
      label: 'Paiement confirmé',
      description: 'Votre paiement a été validé',
      icon: 'fa-solid fa-credit-card',
      completed: false,
      current: false
    },
    {
      status: OrderStatus.PROCESSING,
      label: 'En préparation',
      description: 'Votre commande est en cours de préparation',
      icon: 'fa-solid fa-cog',
      completed: false,
      current: false
    },
    {
      status: OrderStatus.SHIPPED,
      label: 'Expédiée',
      description: 'Votre commande a été expédiée',
      icon: 'fa-solid fa-truck',
      completed: false,
      current: false
    },
    {
      status: OrderStatus.DELIVERED,
      label: 'Livrée',
      description: 'Votre commande a été livrée',
      icon: 'fa-solid fa-check-circle',
      completed: false,
      current: false
    }
  ];

  constructor(
    private orderService: OrderService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const orderId = params['id'];
      if (orderId) {
        this.loadOrder(+orderId);
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['orderNumber']) {
        this.orderNumber = params['orderNumber'];
        this.searchOrderByNumber();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrder(orderId: number): void {
    this.loading = true;
    this.error = '';

    this.orderService.getOrderById(orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.updateTrackingSteps();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading order:', error);
        this.error = 'Commande non trouvée ou erreur de chargement';
        this.loading = false;
      }
    });
  }

  searchOrderByNumber(): void {
    if (!this.orderNumber) return;

    this.loading = true;
    this.error = '';

    // This would typically call a search API
    // For now, we'll simulate by trying to find by order number
    this.orderService.getOrders().subscribe({
      next: (orders) => {
        const foundOrder = orders.find(o => o.orderNumber === this.orderNumber);
        if (foundOrder) {
          this.order = foundOrder;
          this.updateTrackingSteps();
          this.router.navigate(['/order-tracking', foundOrder.id]);
        } else {
          this.error = 'Aucune commande trouvée avec ce numéro';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error searching order:', error);
        this.error = 'Erreur lors de la recherche de la commande';
        this.loading = false;
      }
    });
  }

  updateTrackingSteps(): void {
    if (!this.order) return;

    this.trackingSteps.forEach((step, index) => {
      step.completed = this.isStepCompleted(step.status);
      step.current = this.order!.status === step.status;

      if (step.current) {
        // Update description based on current status
        if (this.order!.status === OrderStatus.SHIPPED && this.order!.shippedAt) {
          step.description = `Expédiée le ${this.formatDate(this.order!.shippedAt)}`;
        } else if (this.order!.status === OrderStatus.DELIVERED && this.order!.deliveredAt) {
          step.description = `Livrée le ${this.formatDate(this.order!.deliveredAt)}`;
        }
      }
    });
  }

  isStepCompleted(status: OrderStatus): boolean {
    if (!this.order) return false;

    const statusOrder = [
      OrderStatus.PENDING,
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED
    ];

    const currentIndex = statusOrder.indexOf(this.order.status);
    const stepIndex = statusOrder.indexOf(status);

    return stepIndex < currentIndex;
  }

  getCurrentStepIndex(): number {
    if (!this.order) return 0;

    const statusOrder = [
      OrderStatus.PENDING,
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED
    ];

    return statusOrder.indexOf(this.order.status);
  }

  getEstimatedDeliveryDate(): string {
    if (!this.order) return '';

    const createdDate = new Date(this.order.createdAt);
    const estimatedDate = new Date(createdDate);

    // Add estimated delivery time based on shipping method
    switch (this.order.shipping.method) {
      case 'express':
        estimatedDate.setDate(createdDate.getDate() + 2);
        break;
      case 'standard':
        estimatedDate.setDate(createdDate.getDate() + 5);
        break;
      default:
        estimatedDate.setDate(createdDate.getDate() + 3);
    }

    return this.formatDate(estimatedDate);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStepDate(status: OrderStatus): string {
    if (!this.order) return '';

    switch (status) {
      case OrderStatus.PENDING:
        return this.formatDate(this.order.createdAt);
      case OrderStatus.PAID:
        return this.order.payment.paidAt ? this.formatDate(this.order.payment.paidAt) : '';
      case OrderStatus.PROCESSING:
        return this.order.updatedAt ? this.formatDate(this.order.updatedAt) : '';
      case OrderStatus.SHIPPED:
        return this.order.shippedAt ? this.formatDate(this.order.shippedAt) : '';
      case OrderStatus.DELIVERED:
        return this.order.deliveredAt ? this.formatDate(this.order.deliveredAt) : '';
      default:
        return '';
    }
  }

  getStatusClass(status: OrderStatus): string {
    return this.orderService.getStatusClass(status);
  }

  getStatusLabel(status: OrderStatus): string {
    return this.orderService.getStatusLabel(status);
  }

  canCancelOrder(): boolean {
    if (!this.order) return false;
    return [OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PROCESSING].includes(this.order.status);
  }

  requestCancellation(): void {
    if (!this.order) return;

    const reason = prompt('Raison de l\'annulation:');
    if (reason) {
      this.orderService.cancelOrder(this.order.id, reason).subscribe({
        next: (updatedOrder) => {
          this.order = updatedOrder;
          this.updateTrackingSteps();
        },
        error: (error) => {
          console.error('Error cancelling order:', error);
          this.notificationService.createNotification({
            userId: '1', // TODO: Get current user ID
            type: NotificationType.ORDER_CANCELLED,
            title: 'Erreur d\'annulation',
            message: 'Erreur lors de la demande d\'annulation',
            read: false,
            priority: NotificationPriority.NORMAL,
            category: NotificationCategory.ORDERS
          }).subscribe();
        }
      });
    }
  }

  contactSupport(): void {
    // Logic to contact support
    this.notificationService.createNotification({
      userId: '1', // TODO: Get current user ID
      type: NotificationType.CUSTOMER_ORDER_UPDATE,
      title: 'Contact Support',
      message: 'Contactez notre support au +221 XX XXX XX XX ou par email: support@klick.sn',
      read: false,
      priority: NotificationPriority.NORMAL,
      category: NotificationCategory.SYSTEM
    }).subscribe();
  }

  reorder(): void {
    if (!this.order) return;

    // Logic to add order items back to cart
    console.log('Reorder items:', this.order.items);
    this.router.navigate(['/cart'], {
      queryParams: { reorder: this.order.id }
    });
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }

  shareOrder(): void {
    if (navigator.share && this.order) {
      navigator.share({
        title: `Commande ${this.order.orderNumber}`,
        text: `Suivez ma commande ${this.order.orderNumber} sur Klick`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      this.notificationService.createNotification({
        userId: '1', // TODO: Get current user ID
        type: NotificationType.SYSTEM_UPDATE,
        title: 'Lien copié',
        message: 'Lien copié dans le presse-papiers',
        read: false,
        priority: NotificationPriority.LOW,
        category: NotificationCategory.SYSTEM
      }).subscribe();
    }
  }
}