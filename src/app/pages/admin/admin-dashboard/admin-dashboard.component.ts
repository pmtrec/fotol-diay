import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AdminService, AdminStats, SystemMetrics, DashboardActivity, SystemAlert } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Données principales du dashboard
  adminStats: AdminStats = {
    totalUsers: 0,
    monthlySales: 0,
    totalProducts: 0,
    totalRevenue: 0,
    userGrowth: 0,
    salesGrowth: 0,
    productGrowth: 0,
    revenueGrowth: 0
  };

  systemMetrics: SystemMetrics = {
    systemLoad: 0,
    databaseHealth: 0,
    uptime: '0j 0h 0m'
  };

  recentActivities: DashboardActivity[] = [];
  systemAlerts: SystemAlert[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadAllDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAllDashboardData(): void {
    // Charger les statistiques principales
    this.adminService.getDashboardStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.adminStats = stats;
      });

    // Charger les métriques système
    this.adminService.getSystemMetrics()
      .pipe(takeUntil(this.destroy$))
      .subscribe(metrics => {
        this.systemMetrics = metrics;
      });

    // Charger les activités récentes
    this.adminService.getRecentActivities()
      .pipe(takeUntil(this.destroy$))
      .subscribe(activities => {
        this.recentActivities = activities;
      });

    // Charger les alertes système
    this.adminService.getSystemAlerts()
      .pipe(takeUntil(this.destroy$))
      .subscribe(alerts => {
        this.systemAlerts = alerts;
      });
  }

  refreshData(): void {
    this.adminService.refreshAllData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadAllDashboardData();
      });
  }

  getGrowthClass(growth: number): string {
    return growth >= 0 ? 'positive' : 'negative';
  }

  getGrowthIcon(growth: number): string {
    return growth >= 0 ? 'icon-arrow-up' : 'icon-arrow-down';
  }
}