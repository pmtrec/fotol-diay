import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { User, UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-clients-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './clients-management.component.html',
  styleUrls: ['./clients-management.component.scss']
})
export class ClientsManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  clients: User[] = [];
  filteredClients: User[] = [];
  loading = false;
  searchTerm = '';
  selectedClient: User | null = null;
  showClientModal = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Filters
  statusFilter = 'all'; // all, active, inactive
  sortBy = 'createdAt';
  sortOrder = 'desc';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadClients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadClients(): void {
    this.loading = true;
    // For now, we'll filter users with CUSTOMER role from the general users method
    this.adminService.getUsers(this.currentPage, this.itemsPerPage).subscribe({
      next: (response) => {
        // Filter only customers
        this.clients = response.users?.filter((user: User) => user.role === UserRole.CUSTOMER) || [];
        this.totalItems = response.total || this.clients.length;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.clients];

    // Search filter
    if (this.searchTerm) {
      filtered = filtered.filter(client =>
        client.firstName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.lastName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.username?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(client =>
        this.statusFilter === 'active' ? client.isActive : !client.isActive
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

    this.filteredClients = filtered;
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
    this.applyFilters();
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
    this.loadClients();
  }

  viewClient(client: User): void {
    this.selectedClient = client;
    this.showClientModal = true;
  }

  closeClientModal(): void {
    this.showClientModal = false;
    this.selectedClient = null;
  }

  toggleClientStatus(client: User): void {
    const newStatus = !client.isActive;
    this.adminService.updateUser(client.id.toString(), { ...client, isActive: newStatus })
      .subscribe({
        next: () => {
          client.isActive = newStatus;
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error updating client status:', error);
        }
      });
  }

  deleteClient(client: User): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le client ${client.firstName} ${client.lastName} ?`)) {
      this.adminService.deleteUser(client.id.toString()).subscribe({
        next: () => {
          this.clients = this.clients.filter(c => c.id !== client.id);
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error deleting client:', error);
        }
      });
    }
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'status-active' : 'status-inactive';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Actif' : 'Inactif';
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
}