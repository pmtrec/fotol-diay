import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  currentRoute = '';
  private destroy$ = new Subject<void>();

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.currentRoute = this.router.url;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Vérifier si la route est active
  isActiveRoute(route: string): boolean {
    return this.currentRoute === route || this.currentRoute.startsWith(route + '/');
  }

  // Navigation programmatique
  navigateTo(route: string): void {
    this.currentRoute = route;
    this.router.navigate([route]);
  }

  // Contacter le support
  contactSupport(): void {
    // Ouvrir WhatsApp ou modal de support
    window.open('https://wa.me/1234567890?text=Bonjour, j\'ai besoin d\'aide', '_blank');
  }
}
