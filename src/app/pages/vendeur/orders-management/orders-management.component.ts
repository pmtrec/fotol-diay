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

  // Make OrderStatus enum available in template
  OrderStatus = OrderStatus;

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = false;
  searchTerm = '';
  selectedOrder: Order | null = null;
  showOrderModal = false;

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

  // Current seller info
  currentSellerId: string | null = null;

  // Statistics
  sellerStats = {
    total: 0,
    pending: 0,
    paid: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0
  };

  constructor(
    private orderService: OrderService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getCurrentSellerId();
    this.loadOrders();
    this.loadSellerStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCurrentSellerId(): void {
    // Get current user and extract seller ID
    this.authService.currentUser$.subscribe({
      next: (user) => {
        this.currentSellerId = user?.id || null;
      },
      error: (error) => {
        console.error('Error getting current user:', error);
      }
    });
  }

  loadOrders(): void {
    if (!this.currentSellerId) return;

    this.loading = true;
    const filters: OrderFilters = {
      sellerId: this.currentSellerId
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

  loadSellerStats(): void {
    if (!this.currentSellerId) return;

    this.orderService.getOrderStats({ sellerId: this.currentSellerId }).subscribe({
      next: (stats) => {
        this.sellerStats = {
          total: stats.totalOrders,
          pending: stats.ordersByStatus[OrderStatus.PENDING] || 0,
          paid: stats.ordersByStatus[OrderStatus.PAID] || 0,
          processing: stats.ordersByStatus[OrderStatus.PROCESSING] || 0,
          shipped: stats.ordersByStatus[OrderStatus.SHIPPED] || 0,
          delivered: stats.ordersByStatus[OrderStatus.DELIVERED] || 0,
          cancelled: stats.ordersByStatus[OrderStatus.CANCELLED] || 0,
          totalRevenue: stats.totalRevenue
        };
      },
      error: (error) => {
        console.error('Error loading seller stats:', error);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.orders];

    // Search filter
    if (this.searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.customerInfo.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.customerInfo.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.customerInfo.email.toLowerCase().includes(this.searchTerm.toLowerCase())
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

  updateOrderStatus(order: Order, newStatus: OrderStatus): void {
    if (confirm(`Êtes-vous sûr de vouloir changer le statut de la commande ${order.orderNumber} à "${this.orderService.getStatusLabel(newStatus)}" ?`)) {
      this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
        next: (updatedOrder) => {
          const index = this.orders.findIndex(o => o.id === order.id);
          if (index !== -1) {
            this.orders[index] = updatedOrder;
            this.applyFilters();
            this.loadSellerStats();
          }
          this.closeOrderModal();
        },
        error: (error) => {
          console.error('Error updating order status:', error);
        }
      });
    }
  }

  markAsProcessing(order: Order): void {
    this.updateOrderStatus(order, OrderStatus.PROCESSING);
  }

  markAsShipped(order: Order): void {
    this.updateOrderStatus(order, OrderStatus.SHIPPED);
  }

  markAsDelivered(order: Order): void {
    this.updateOrderStatus(order, OrderStatus.DELIVERED);
  }

  cancelOrder(order: Order): void {
    const reason = prompt('Raison de l\'annulation:');
    if (reason) {
      this.orderService.cancelOrder(order.id, reason).subscribe({
        next: (updatedOrder) => {
          const index = this.orders.findIndex(o => o.id === order.id);
          if (index !== -1) {
            this.orders[index] = updatedOrder;
            this.applyFilters();
            this.loadSellerStats();
          }
        },
        error: (error) => {
          console.error('Error cancelling order:', error);
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  canUpdateStatus(order: Order, targetStatus: OrderStatus): boolean {
    const statusFlow: { [key in OrderStatus]: OrderStatus[] } = {
      [OrderStatus.PENDING]: [],
      [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: []
    };

    return statusFlow[order.status]?.includes(targetStatus) || false;
  }

  getPendingOrdersCount(): number {
    return this.orders.filter(order => order.status === OrderStatus.PAID || order.status === OrderStatus.PROCESSING).length;
  }

  getTotalRevenue(): number {
    return this.orders
      .filter(order => order.status === OrderStatus.DELIVERED)
      .reduce((total, order) => total + order.total, 0);
  }
}