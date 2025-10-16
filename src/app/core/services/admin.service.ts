import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { UserRole } from '../models/user.model';

// Interfaces pour les données admin
export interface AdminStats {
  totalUsers: number;
  monthlySales: number;
  totalProducts: number;
  totalRevenue: number;
  userGrowth: number;
  salesGrowth: number;
  productGrowth: number;
  revenueGrowth: number;
}

export interface SystemMetrics {
  systemLoad: number;
  databaseHealth: number;
  uptime: string;
}

export interface DashboardActivity {
  id: number;
  type: 'user' | 'order' | 'product' | 'system';
  icon: string;
  message: string;
  time: string;
  action?: boolean;
}

export interface SystemAlert {
  id: number;
  type: 'warning' | 'error' | 'info' | 'success';
  icon: string;
  title: string;
  message: string;
  time: string;
}

export interface ClientFilters {
  search?: string;
  isActive?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface ClientStats {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  newClientsThisMonth: number;
  clientGrowth: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private baseUrl = 'api/admin'; // À adapter selon votre API

  // BehaviorSubjects pour les données en temps réel
  private statsSubject = new BehaviorSubject<AdminStats | null>(null);
  private activitiesSubject = new BehaviorSubject<DashboardActivity[]>([]);
  private alertsSubject = new BehaviorSubject<SystemAlert[]>([]);
  private metricsSubject = new BehaviorSubject<SystemMetrics | null>(null);

  // Observables publics
  public stats$ = this.statsSubject.asObservable();
  public activities$ = this.activitiesSubject.asObservable();
  public alerts$ = this.alertsSubject.asObservable();
  public metrics$ = this.metricsSubject.asObservable();

  constructor(private apiService: ApiService) {
    // Démarrer les mises à jour automatiques
    this.startPeriodicUpdates();
  }

  // 📊 Récupérer les statistiques principales
  getDashboardStats(): Observable<AdminStats> {
    // Simulation d'appel API - remplacer par de vraies données
    const mockStats: AdminStats = {
      totalUsers: Math.floor(Math.random() * 10000) + 5000,
      monthlySales: Math.floor(Math.random() * 50000) + 25000,
      totalProducts: Math.floor(Math.random() * 1000) + 500,
      totalRevenue: Math.floor(Math.random() * 200000) + 100000,
      userGrowth: Math.floor(Math.random() * 40) - 20,
      salesGrowth: Math.floor(Math.random() * 30) + 5,
      productGrowth: Math.floor(Math.random() * 25) - 10,
      revenueGrowth: Math.floor(Math.random() * 35) + 10
    };

    return of(mockStats).pipe(delay(800));
  }

  // ⚡ Récupérer les métriques système
  getSystemMetrics(): Observable<SystemMetrics> {
    const mockMetrics: SystemMetrics = {
      systemLoad: Math.floor(Math.random() * 60) + 20,
      databaseHealth: Math.floor(Math.random() * 20) + 80,
      uptime: this.calculateUptime()
    };

    return of(mockMetrics).pipe(delay(500));
  }

  // 🔔 Récupérer les activités récentes
  getRecentActivities(): Observable<DashboardActivity[]> {
    const mockActivities: DashboardActivity[] = [
      {
        id: 1,
        type: 'user',
        icon: 'fa-solid fa-user-plus',
        message: 'Nouvel utilisateur inscrit: jean.dupont@email.com',
        time: '2 min ago',
        action: true
      },
      {
        id: 2,
        type: 'order',
        icon: 'fa-solid fa-shopping-cart',
        message: 'Nouvelle commande #12345 - 3 articles',
        time: '5 min ago',
        action: true
      },
      {
        id: 3,
        type: 'product',
        icon: 'fa-solid fa-box',
        message: 'Produit "iPhone 15 Pro" ajouté au catalogue',
        time: '12 min ago'
      },
      {
        id: 4,
        type: 'system',
        icon: 'fa-solid fa-shield-alt',
        message: 'Sauvegarde automatique effectuée avec succès',
        time: '1h ago'
      },
      {
        id: 5,
        type: 'user',
        icon: 'fa-solid fa-user-edit',
        message: 'Profil vendeur mis à jour: TechStore SARL',
        time: '2h ago'
      }
    ];

    return of(mockActivities).pipe(delay(600));
  }

  // 🚨 Récupérer les alertes système
  getSystemAlerts(): Observable<SystemAlert[]> {
    const mockAlerts: SystemAlert[] = [
      {
        id: 1,
        type: 'warning',
        icon: 'fa-solid fa-exclamation-triangle',
        title: 'Stock faible',
        message: '5 produits ont un stock inférieur à 10 unités',
        time: '30 min ago'
      },
      {
        id: 2,
        type: 'error',
        icon: 'fa-solid fa-times-circle',
        title: 'Erreur de paiement',
        message: 'Échec de traitement pour la commande #12340',
        time: '1h ago'
      },
      {
        id: 3,
        type: 'info',
        icon: 'fa-solid fa-info-circle',
        title: 'Maintenance programmée',
        message: 'Maintenance serveur prévue ce soir à 2h00',
        time: '3h ago'
      }
    ];

    return of(mockAlerts).pipe(delay(400));
  }

  // 📈 Récupérer les données pour les graphiques
  getChartData(chartType: 'sales' | 'users' | 'products' | 'categories'): Observable<any> {
    const mockData = {
      sales: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
        datasets: [
          {
            label: 'Ventes 2024',
            data: [12000, 19000, 15000, 25000, 22000, 30000],
            borderColor: '#007bff',
            backgroundColor: '#007bff20',
          },
          {
            label: 'Ventes 2023',
            data: [10000, 15000, 12000, 20000, 18000, 25000],
            borderColor: '#6c757d',
            backgroundColor: '#6c757d20',
          }
        ]
      },
      users: {
        labels: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
        datasets: [{
          data: Array.from({length: 7}, () => Math.floor(Math.random() * 100)),
          borderColor: '#007bff',
          backgroundColor: '#007bff20',
        }]
      },
      products: {
        labels: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
        datasets: [{
          data: Array.from({length: 7}, () => Math.floor(Math.random() * 50)),
          borderColor: '#28a745',
          backgroundColor: '#28a74520',
        }]
      },
      categories: {
        labels: ['Électronique', 'Mode', 'Maison', 'Sports', 'Livres'],
        datasets: [{
          data: [35, 25, 20, 15, 5],
          backgroundColor: ['#007bff', '#28a745', '#17a2b8', '#ffc107', '#dc3545'],
        }]
      }
    };

    return of(mockData[chartType]).pipe(delay(700));
  }

  // 🔄 Actualiser toutes les données
  refreshAllData(): Observable<any> {
    return new Observable(subscriber => {
      // Actualiser les statistiques
      this.getDashboardStats().subscribe(stats => {
        this.statsSubject.next(stats);

        // Actualiser les métriques système
        this.getSystemMetrics().subscribe(metrics => {
          this.metricsSubject.next(metrics);

          // Actualiser les activités
          this.getRecentActivities().subscribe(activities => {
            this.activitiesSubject.next(activities);

            // Actualiser les alertes
            this.getSystemAlerts().subscribe(alerts => {
              this.alertsSubject.next(alerts);
              subscriber.next({ success: true });
              subscriber.complete();
            });
          });
        });
      });
    });
  }

  // ⏱️ Démarrer les mises à jour périodiques
  private startPeriodicUpdates(): void {
    // Mise à jour toutes les 30 secondes
    setInterval(() => {
      this.refreshAllData().subscribe();
    }, 30000);

    // Mise à jour initiale
    this.refreshAllData().subscribe();
  }

  // ⏰ Calculer l'uptime système
  private calculateUptime(): string {
    const now = new Date();
    const startTime = new Date(now.getTime() - (Math.random() * 30 * 24 * 60 * 60 * 1000));
    const diff = now.getTime() - startTime.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}j ${hours}h ${minutes}m`;
  }

  // 📊 Méthodes CRUD pour l'administration
  getUsers(page: number = 1, limit: number = 10): Observable<any> {
    return this.apiService.get(`${this.baseUrl}/users?page=${page}&limit=${limit}`);
  }

  getUserById(id: string): Observable<any> {
    return this.apiService.get(`${this.baseUrl}/users/${id}`);
  }

  updateUser(id: string, userData: any): Observable<any> {
    return this.apiService.put(`${this.baseUrl}/users/${id}`, userData);
  }

  deleteUser(id: string): Observable<any> {
    return this.apiService.delete(`${this.baseUrl}/users/${id}`);
  }

  getProducts(page: number = 1, limit: number = 10): Observable<any> {
    return this.apiService.get(`${this.baseUrl}/products?page=${page}&limit=${limit}`);
  }

  validateProduct(productId: string): Observable<any> {
    return this.apiService.post(`${this.baseUrl}/products/${productId}/validate`, {});
  }

  rejectProduct(productId: string, reason: string): Observable<any> {
    return this.apiService.post(`${this.baseUrl}/products/${productId}/reject`, { reason });
  }

  getOrders(page: number = 1, limit: number = 10): Observable<any> {
    return this.apiService.get(`${this.baseUrl}/orders?page=${page}&limit=${limit}`);
  }

  updateOrderStatus(orderId: string, status: string): Observable<any> {
    return this.apiService.put(`${this.baseUrl}/orders/${orderId}/status`, { status });
  }

  getAnalytics(period: string = 'month'): Observable<any> {
    return this.apiService.get(`${this.baseUrl}/analytics?period=${period}`);
  }

  exportData(type: 'users' | 'products' | 'orders', format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    return this.apiService.get(`${this.baseUrl}/export/${type}?format=${format}`)
      .pipe(map(response => new Blob([response as any])));
  }

  // 👥 Client-specific methods
  getClients(page: number = 1, limit: number = 10, filters?: ClientFilters): Observable<any> {
    let params = `?page=${page}&limit=${limit}&role=${UserRole.CUSTOMER}`;
    if (filters) {
      if (filters.isActive !== undefined) params += `&isActive=${filters.isActive}`;
      if (filters.search) params += `&search=${encodeURIComponent(filters.search)}`;
      if (filters.dateFrom) params += `&dateFrom=${filters.dateFrom}`;
      if (filters.dateTo) params += `&dateTo=${filters.dateTo}`;
    }
    return this.apiService.get(`${this.baseUrl}/clients${params}`);
  }

  getClientById(id: string): Observable<any> {
    return this.apiService.get(`${this.baseUrl}/clients/${id}`);
  }

  getClientStats(): Observable<ClientStats> {
    return this.apiService.get(`${this.baseUrl}/clients/stats`);
  }

  updateClientStatus(clientId: string, isActive: boolean): Observable<any> {
    return this.apiService.patch(`${this.baseUrl}/clients/${clientId}/status`, { isActive });
  }

  bulkUpdateClients(clientIds: string[], action: 'activate' | 'deactivate' | 'delete'): Observable<any> {
    return this.apiService.post(`${this.baseUrl}/clients/bulk`, { clientIds, action });
  }

  exportClients(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    return this.apiService.get(`${this.baseUrl}/clients/export?format=${format}`)
      .pipe(map(response => new Blob([response as any])));
  }
}