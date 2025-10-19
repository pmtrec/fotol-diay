import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';

interface PlatformStats {
  totalProducts: number;
  totalSellers: number;
  totalUsers: number;
  totalOrders: number;
}

interface Category {
  id: number;
  name: string;
  icon: string;
  productCount: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  images: string[];
  rating: number;
  reviewCount: number;
  isNew?: boolean;
}

interface Testimonial {
  id: number;
  name: string;
  location: string;
  comment: string;
  rating: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {

  platformStats: PlatformStats = {
    totalProducts: 0,
    totalSellers: 0,
    totalUsers: 0,
    totalOrders: 0
  };

  popularCategories: Category[] = [];
  featuredProducts: Product[] = [];
  testimonials: Testimonial[] = [];

  constructor(private router: Router, private adminService: AdminService) {}

  ngOnInit() {
    this.loadPlatformStats();
    this.loadPopularCategories();
    this.loadFeaturedProducts();
    this.loadTestimonials();
  }

  private loadPlatformStats() {
    // Utiliser les données de l'AdminService pour les statistiques plateforme
    this.adminService.getDashboardStats().subscribe(stats => {
      this.platformStats = {
        totalProducts: stats.totalProducts,
        totalSellers: Math.floor(stats.totalUsers * 0.3), // Estimation 30% vendeurs
        totalUsers: stats.totalUsers,
        totalOrders: Math.floor(stats.monthlySales / 50000) // Estimation basée sur les ventes
      };
    });
  }

  private loadPopularCategories() {
    this.popularCategories = [
      { id: 1, name: 'Électronique', icon: 'icon-laptop', productCount: 1250 },
      { id: 2, name: 'Mode & Beauté', icon: 'icon-shirt', productCount: 890 },
      { id: 3, name: 'Maison & Jardin', icon: 'icon-home', productCount: 654 },
      { id: 4, name: 'Sports & Loisirs', icon: 'icon-ball', productCount: 432 },
      { id: 5, name: 'Livres & Médias', icon: 'icon-book', productCount: 321 },
      { id: 6, name: 'Auto & Moto', icon: 'icon-car', productCount: 287 }
    ];
  }

  private loadFeaturedProducts() {
    this.featuredProducts = [
      {
        id: 1,
        name: 'iPhone 15 Pro Max',
        price: 850000,
        images: ['assets/images/products/iphone.jpg'],
        rating: 4.8,
        reviewCount: 124,
        isNew: true
      },
      {
        id: 2,
        name: 'MacBook Air M3',
        price: 1200000,
        images: ['assets/images/products/macbook.jpg'],
        rating: 4.9,
        reviewCount: 89
      },
      {
        id: 3,
        name: 'Samsung Galaxy Watch 6',
        price: 285000,
        images: ['assets/images/products/watch.jpg'],
        rating: 4.6,
        reviewCount: 156
      },
      {
        id: 4,
        name: 'Nike Air Max 270',
        price: 95000,
        images: ['assets/images/products/nike.jpg'],
        rating: 4.7,
        reviewCount: 203
      }
    ];
  }

  private loadTestimonials() {
    this.testimonials = [
      {
        id: 1,
        name: 'Marie Dubois',
        location: 'Dakar, Sénégal',
        comment: 'Excellent service et produits de qualité. Livraison rapide et sécurisée.',
        rating: 5
      },
      {
        id: 2,
        name: 'Ahmed Sall',
        location: 'Abidjan, Côte d\'Ivoire',
        comment: 'Plateforme très intuitive avec une grande variété de produits.',
        rating: 5
      },
      {
        id: 3,
        name: 'Fatou Diop',
        location: 'Casablanca, Maroc',
        comment: 'Les vendeurs sont professionnels et les prix sont compétitifs.',
        rating: 4
      }
    ];
  }

  getStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}