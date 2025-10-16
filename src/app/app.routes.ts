import { Routes } from '@angular/router';
import { RoleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/user.model';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./modules/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'cart',
        loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent)
      },
      {
        path: 'produits/ajouter',
        loadComponent: () => import('./features/produits/pages/ajouter-produit/ajouter-produit.component').then(m => m.AjouterProduitComponent)
      }
    ]
  },
  {
    path: 'vendeur',
    loadComponent: () => import('./layouts/vendeur-layout/vendeur-layout.component').then(m => m.VendeurLayoutComponent),
    canActivate: [RoleGuard],
    data: { roles: [UserRole.SELLER] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/vendeur/vendeur-dashboard/vendeur-dashboard.component').then(m => m.VendeurDashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./shared/components/vendeur/produits/produit.component').then(m => m.ProduitsComponent)
      },
      // {
      //   path: 'products',
      //   loadComponent: () => import('./pages/vendeur/product-list/product-list.component').then(m => m.ProductListComponent)
      // },
      {
        path: 'products/add',
        loadComponent: () => import('./pages/vendeur/add-product/add-product.component').then(m => m.AddProductComponent)
      },
      {
        path: 'mes-produits',
        loadComponent: () => import('./features/produits/pages/mes-produits/mes-produits.component').then(m => m.MesProduitsComponent)
      },
      // {
      //   path: 'products/edit/:id',
      //   loadComponent: () => import('./pages/vendeur/edit-product/edit-product.component').then(m => m.EditProductComponent)
      // },
      // {
      //   path: 'orders',
      //   loadComponent: () => import('./pages/vendeur/orders/orders.component').then(m => m.OrdersComponent)
      // },
      // {
      //   path: 'profile',
      //   loadComponent: () => import('./pages/vendeur/profile/profile.component').then(m => m.ProfileComponent)
      // },
      // {
      //   path: 'analytics',
      //   loadComponent: () => import('./pages/vendeur/analytics/analytics.component').then(m => m.AnalyticsComponent)
      // }
    ]
  },
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [RoleGuard],
    data: { roles: [UserRole.ADMIN] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent)
      },
      {
        path: 'sellers',
        loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent)
      },
      {
        path: 'clients',
        loadComponent: () => import('./pages/admin/clients-management/clients-management.component').then(m => m.ClientsManagementComponent)
      },
      {
        path: 'product-validation',
        loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent)
      },
      {
        path: 'validation-produits',
        loadComponent: () => import('./features/produits/pages/admin-validation/admin-validation.component').then(m => m.AdminValidationComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent)
      },
      {
        path: 'content',
        loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent)
      },
      {
        path: 'support',
        loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent)
      }
    ]
  },
  {
    path: 'auth',
    loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
      }
    ]
  },
  {
    path: 'error',
    loadComponent: () => import('./layouts/error-layout/error-layout.component').then(m => m.ErrorLayoutComponent),
    children: [
      {
        path: '404',
        loadComponent: () => import('./pages/error404/error404.component').then(m => m.Error404Component)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'error/404'
  }
];
