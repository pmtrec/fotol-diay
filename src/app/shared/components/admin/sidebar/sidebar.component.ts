import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { filter } from 'rxjs/operators';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  currentRoute = '';

  menuItems: MenuItem[] = [
    {
      label: 'Tableau de Bord',
      icon: 'fa-solid fa-tachometer-alt',
      route: '/admin'
    },
    {
      label: 'Gestion Utilisateurs',
      icon: 'fa-solid fa-users',
      route: '/admin/users',
      badge: 12
    },
    {
      label: 'Gestion Vendeurs',
      icon: 'fa-solid fa-store',
      route: '/admin/sellers',
      badge: 3
    },
    {
      label: 'Validation Produits',
      icon: 'fa-solid fa-check-circle',
      route: '/admin/product-validation',
      badge: 8
    },
    {
      label: 'Gestion Catégories',
      icon: 'fa-solid fa-tags',
      route: '/admin/categories'
    },
    {
      label: 'Gestion Commandes',
      icon: 'fa-solid fa-shopping-cart',
      route: '/admin/orders',
      badge: 25
    },
    {
      label: 'Analytics & Rapports',
      icon: 'fa-solid fa-chart-bar',
      route: '/admin/analytics'
    },
    {
      label: 'Gestion Contenu',
      icon: 'fa-solid fa-file-alt',
      route: '/admin/content'
    },
    {
      label: 'Paramètres Système',
      icon: 'fa-solid fa-cog',
      route: '/admin/settings'
    },
    {
      label: 'Support & Aide',
      icon: 'fa-solid fa-headset',
      route: '/admin/support'
    }
  ];

  constructor(private router: Router) {
    this.router.events
      .pipe(
        takeUntil(this.destroy$),
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
      });
  }

  ngOnInit(): void {
    this.currentRoute = this.router.url;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isActive(route: string): boolean {
    if (route === '/admin') {
      return this.currentRoute === '/admin' || this.currentRoute === '/admin/';
    }
    return this.currentRoute.startsWith(route);
  }

  hasBadge(item: MenuItem): boolean {
    return item.badge !== undefined && item.badge > 0;
  }

  getBadgeClass(item: MenuItem): string {
    if (!item.badge) return '';

    if (item.badge > 20) return 'badge-high';
    if (item.badge > 5) return 'badge-medium';
    return 'badge-low';
  }
}
