import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-container">
      <h1>Admin Panel</h1>
      <p>Current section: {{ currentSection }}</p>
      <div class="admin-content">
        <!-- Admin content will be implemented based on route -->
        <div *ngIf="currentSection === 'dashboard'" class="section-content">
          <h2>Dashboard</h2>
          <p>Welcome to the admin dashboard</p>
        </div>
        <div *ngIf="currentSection === 'users'" class="section-content">
          <h2>Users Management</h2>
          <p>Manage users here</p>
        </div>
        <div *ngIf="currentSection === 'sellers'" class="section-content">
          <h2>Sellers Management</h2>
          <p>Manage sellers here</p>
        </div>
        <div *ngIf="currentSection === 'product-validation'" class="section-content">
          <h2>Product Validation</h2>
          <p>Validate products here</p>
        </div>
        <div *ngIf="currentSection === 'categories'" class="section-content">
          <h2>Categories</h2>
          <p>Manage categories here</p>
        </div>
        <div *ngIf="currentSection === 'orders'" class="section-content">
          <h2>Orders</h2>
          <p>Manage orders here</p>
        </div>
        <div *ngIf="currentSection === 'analytics'" class="section-content">
          <h2>Analytics</h2>
          <p>View analytics here</p>
        </div>
        <div *ngIf="currentSection === 'content'" class="section-content">
          <h2>Content Management</h2>
          <p>Manage content here</p>
        </div>
        <div *ngIf="currentSection === 'settings'" class="section-content">
          <h2>Settings</h2>
          <p>Configure settings here</p>
        </div>
        <div *ngIf="currentSection === 'support'" class="section-content">
          <h2>Support</h2>
          <p>Support management here</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      padding: 20px;
    }
    .admin-content {
      margin-top: 20px;
    }
    .section-content {
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: #f9f9f9;
    }
  `]
})
export class AdminComponent {
  currentSection: string = 'dashboard';

  constructor(private route: ActivatedRoute, private router: Router) {
    this.route.url.subscribe(url => {
      this.currentSection = url[0]?.path || 'dashboard';
    });
  }
}