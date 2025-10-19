import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { Order, OrderStatus, OrderFilters } from '../../../core/models/order.model';

@Component({
  selector: 'app-orders-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './orders-management.component.html',
  styleUrls: ['./orders-management.component.scss']
})
export class OrdersManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = false;
  searchTerm = '';
  selectedOrder: Order | null = null;
  showOrderModal = false;
  showTrackingModal = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Filters
  statusFilter = 'all';
  dateFrom = '';
  dateTo = '';
  sortBy = 'createdAt';
  sortOrder = 'desc';

  // Current customer info
  currentCustomerId: string | null = null;

  // Statistics
  customerStats = {
    total: 0,
    pending: 0,
    paid: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalSpent: 0
  };

  constructor(
    private orderService: OrderService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getCurrentCustomerId();
    this.loadOrders();
    this.loadCustomerStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCurrentCustomerId(): void {
    this.authService.currentUser$.subscribe({
      next: (user) => {
        this.currentCustomerId = user?.id || null;
      },
      error: (error) => {
        console.error('Error getting current user:', error);
      }
    });
  }

  loadOrders(): void {
    if (!this.currentCustomerId) return;

    this.loading = true;
    const filters: OrderFilters = {
      customerId: this.currentCustomerId
    };

    if (this.statusFilter !== 'all') {
      filters.status = [this.statusFilter as OrderStatus];
    }

    if (this.dateFrom) {
      filters.dateFrom = new Date(this.dateFrom);
    }

    if (this.dateTo) {
      filters.dateTo = new Date(this.dateTo);
    }

    this.orderService.getOrders(filters).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.totalItems = orders.length;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.loading = false;
      }
    });
  }

  loadCustomerStats(): void {
    if (!this.currentCustomerId) return;

    this.orderService.getOrderStats().subscribe({
      next: (stats) => {
        this.customerStats = {
          total: stats.totalOrders,
          pending: stats.ordersByStatus[OrderStatus.PENDING] || 0,
          paid: stats.ordersByStatus[OrderStatus.PAID] || 0,
          processing: stats.ordersByStatus[OrderStatus.PROCESSING] || 0,
          shipped: stats.ordersByStatus[OrderStatus.SHIPPED] || 0,
          delivered: stats.ordersByStatus[OrderStatus.DELIVERED] || 0,
          cancelled: stats.ordersByStatus[OrderStatus.CANCELLED] || 0,
          totalSpent: stats.totalRevenue
        };
      },
      error: (error) => {
        console.error('Error loading customer stats:', error);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.orders];

    // Search filter
    if (this.searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.items.some(item =>
          item.productName.toLowerCase().includes(this.searchTerm.toLowerCase())
        )
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = this.getPropertyValue(a, this.sortBy);
      const bValue = this.getPropertyValue(b, this.sortBy);

      if (this.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    this.filteredOrders = filtered;
  }

  private getPropertyValue(obj: any, property: string): any {
    return property.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  onDateFilterChange(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  onSortChange(sortBy: string): void {
    if (this.sortBy === sortBy) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortOrder = 'asc';
    }
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadOrders();
  }

  viewOrder(order: Order): void {
    this.selectedOrder = order;
    this.showOrderModal = true;
  }

  closeOrderModal(): void {
    this.showOrderModal = false;
    this.selectedOrder = null;
  }

  viewTracking(order: Order): void {
    this.selectedOrder = order;
    this.showTrackingModal = true;
  }

  closeTrackingModal(): void {
    this.showTrackingModal = false;
    this.selectedOrder = null;
  }

  reorder(order: Order): void {
    // Logic to add order items back to cart
    console.log('Reorder items:', order.items);
    // This would typically navigate to cart and add items
  }

  requestCancellation(order: Order): void {
    if (confirm('Êtes-vous sûr de vouloir demander l\'annulation de cette commande ?')) {
      this.orderService.cancelOrder(order.id, 'Demande d\'annulation par le client').subscribe({
        next: (updatedOrder) => {
          const index = this.orders.findIndex(o => o.id === order.id);
          if (index !== -1) {
            this.orders[index] = updatedOrder;
            this.applyFilters();
            this.loadCustomerStats();
          }
        },
        error: (error) => {
          console.error('Error requesting cancellation:', error);
        }
      });
    }
  }

  getStatusClass(status: OrderStatus): string {
    return this.orderService.getStatusClass(status);
  }

  getStatusLabel(status: OrderStatus): string {
    return this.orderService.getStatusLabel(status);
  }

  getSortIcon(column: string): string {
    if (this.sortBy !== column) return 'fa-solid fa-sort';
    return this.sortOrder === 'asc' ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down';
  }

  getPaginationArray(): number[] {
    const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  getCurrentPageEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
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

  canReorder(order: Order): boolean {
    return order.status === OrderStatus.DELIVERED;
  }

  canCancelOrder(order: Order): boolean {
    return [OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PROCESSING].includes(order.status);
  }

  getTrackingSteps(order: Order): any[] {
    const steps = [
      { status: OrderStatus.PENDING, label: 'Commande reçue', date: order.createdAt },
      { status: OrderStatus.PAID, label: 'Paiement confirmé', date: order.payment.paidAt },
      { status: OrderStatus.PROCESSING, label: 'En préparation', date: null },
      { status: OrderStatus.SHIPPED, label: 'Expédiée', date: order.shippedAt },
      { status: OrderStatus.DELIVERED, label: 'Livrée', date: order.deliveredAt }
    ];

    return steps;
  }

  getCurrentTrackingStep(order: Order): number {
    const steps = this.getTrackingSteps(order);
    return steps.findIndex(step => step.status === order.status);
  }

  getActiveOrdersCount(): number {
    return this.orders.filter(order =>
      [OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED].includes(order.status)
    ).length;
  }

  getRecentOrders(): Order[] {
    return this.orders
      .filter(order => order.status === OrderStatus.DELIVERED)
      .sort((a, b) => new Date(b.deliveredAt || b.createdAt).getTime() - new Date(a.deliveredAt || a.createdAt).getTime())
      .slice(0, 3);
  }
}