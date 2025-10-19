import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ProductService, Produit } from '../../core/services/product.service';
import { SellerService } from '../../core/services/seller.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Statistics data
  stats = {
    productsAvailable: 1462,
    activeSellers: 2085,
    satisfiedCustomers: 6952,
    ordersProcessed: 1
  };

  // Popular categories with product counts
  popularCategories = [
    { name: 'Électronique', productCount: 1250, icon: 'fa-solid fa-laptop' },
    { name: 'Mode & Beauté', productCount: 890, icon: 'fa-solid fa-tshirt' },
    { name: 'Maison & Jardin', productCount: 654, icon: 'fa-solid fa-home' },
    { name: 'Sports & Loisirs', productCount: 432, icon: 'fa-solid fa-futbol' },
    { name: 'Livres & Médias', productCount: 321, icon: 'fa-solid fa-book' },
    { name: 'Auto & Moto', productCount: 287, icon: 'fa-solid fa-car' }
  ];

  // Customer testimonials
  testimonials = [
    {
      name: 'Marie Dubois',
      location: 'Dakar, Sénégal',
      message: 'Excellent service et produits de qualité. Livraison rapide et sécurisée.',
      rating: 5
    },
    {
      name: 'Ahmed Sall',
      location: 'Abidjan, Côte d\'Ivoire',
      message: 'Plateforme très intuitive avec une grande variété de produits.',
      rating: 5
    },
    {
      name: 'Fatou Diop',
      location: 'Casablanca, Maroc',
      message: 'Les vendeurs sont professionnels et les prix sont compétitifs.',
      rating: 5
    }
  ];

  // Featured products
  featuredProducts: Produit[] = [];
  isLoading = false;

  constructor(
    private productService: ProductService,
    private sellerService: SellerService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.loadFeaturedProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFeaturedProducts(): void {
    this.isLoading = true;

    this.productService.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          // Get approved products and take the first 4 as featured
          this.featuredProducts = products
            .filter(p => p.status === 'approved')
            .slice(0, 4);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des produits en vedette:', error);
          this.isLoading = false;
        }
      });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price) + ' F CFA';
  }
}