import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { User, UserRole } from '../models/user.model';
import { Product, ProductStatus } from '../models/product.model';
import { Category } from '../models/category.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private baseUrl = 'http://localhost:3002'; // URL du serveur JSON

  constructor(private apiService: ApiService) {}

  // Get all users
  getUsers(): Observable<User[]> {
    return this.apiService.get<User[]>(`${this.baseUrl}/users`).pipe(
      map(users => users.map(user => ({
        ...user,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      })))
    );
  }

  // Get user by ID
  getUserById(id: number): Observable<User | undefined> {
    return this.apiService.get<User>(`${this.baseUrl}/users/${id}`).pipe(
      map(user => user ? {
        ...user,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      } : undefined)
    );
  }

  // Get users by role
  getUsersByRole(role: UserRole): Observable<User[]> {
    return this.getUsers().pipe(
      map(users => users.filter(u => u.role === role))
    );
  }

  // Get all categories
  getCategories(): Observable<Category[]> {
    return this.apiService.get<Category[]>(`${this.baseUrl}/categories`).pipe(
      map(categories => categories.map(category => ({
        ...category,
        createdAt: new Date(category.createdAt),
        updatedAt: new Date(category.updatedAt)
      })))
    );
  }

  // Get category by ID
  getCategoryById(id: number): Observable<Category | undefined> {
    return this.apiService.get<Category>(`${this.baseUrl}/categories/${id}`).pipe(
      map(category => category ? {
        ...category,
        createdAt: new Date(category.createdAt),
        updatedAt: new Date(category.updatedAt)
      } : undefined)
    );
  }

  // Get all products
  getProducts(): Observable<Product[]> {
    return this.apiService.get<Product[]>(`${this.baseUrl}/products`).pipe(
      map(products => products.map(product => ({
        ...product,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt),
        validatedAt: product.validatedAt ? new Date(product.validatedAt) : undefined
      })))
    );
  }

  // Get product by ID
  getProductById(id: number): Observable<Product | undefined> {
    return this.apiService.get<Product>(`${this.baseUrl}/products/${id}`).pipe(
      map(product => product ? {
        ...product,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt),
        validatedAt: product.validatedAt ? new Date(product.validatedAt) : undefined
      } : undefined)
    );
  }

  // Get products by seller ID
  getProductsBySeller(sellerId: number): Observable<Product[]> {
    return this.getProducts().pipe(
      map(products => products.filter(p => p.sellerId === sellerId))
    );
  }

  // Get pending products
  getPendingProducts(): Observable<Product[]> {
    return this.getProducts().pipe(
      map(products => products.filter(p => p.status === ProductStatus.PENDING))
    );
  }

  // Get approved products
  getApprovedProducts(): Observable<Product[]> {
    return this.getProducts().pipe(
      map(products => products.filter(p => p.status === ProductStatus.APPROVED))
    );
  }

  // Get products by category
  getProductsByCategory(category: string): Observable<Product[]> {
    return this.getProducts().pipe(
      map(products => products.filter(p => p.category === category && p.status === ProductStatus.APPROVED))
    );
  }

  // Approve product
  approveProduct(productId: number, adminId: number): Observable<Product> {
    const updateData = {
      status: ProductStatus.APPROVED,
      validatedBy: adminId,
      validatedAt: new Date(),
      updatedAt: new Date()
    };

    return this.apiService.patch<Product>(`${this.baseUrl}/products/${productId}`, updateData);
  }

  // Reject product
  rejectProduct(productId: number, adminId: number, reason: string): Observable<Product> {
    const updateData = {
      status: ProductStatus.REJECTED,
      validatedBy: adminId,
      validatedAt: new Date(),
      rejectionReason: reason,
      updatedAt: new Date()
    };

    return this.apiService.patch<Product>(`${this.baseUrl}/products/${productId}`, updateData);
  }

  // Add new product
  addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Observable<Product> {
    const newProduct = {
      ...product,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.apiService.post<Product>(`${this.baseUrl}/products`, newProduct);
  }

  // Get dashboard stats for admin
  getAdminDashboardStats(): Observable<any> {
    return this.getProducts().pipe(
      map(products => {
        const totalProducts = products.length;
        const pendingProducts = products.filter(p => p.status === ProductStatus.PENDING).length;
        const approvedProducts = products.filter(p => p.status === ProductStatus.APPROVED).length;

        return this.getUsers().pipe(
          map(users => {
            const totalSellers = users.filter(u => u.role === UserRole.SELLER).length;

            return this.getCategories().pipe(
              map(categories => ({
                totalProducts,
                pendingProducts,
                approvedProducts,
                totalSellers,
                totalCategories: categories.length
              }))
            );
          })
        );
      })
    ).pipe(
      // Flatten the nested observables
      map(obs => obs.pipe(map(innerObs => innerObs.pipe(map(finalResult => finalResult)))))
    ).pipe(
      // Execute the nested observables
      map(obs => obs.pipe(map(innerObs => innerObs)))
    );
  }

  // Get dashboard stats for seller
  getSellerDashboardStats(sellerId: number): Observable<any> {
    return this.getProductsBySeller(sellerId).pipe(
      map(products => {
        const totalProducts = products.length;
        const pendingProducts = products.filter(p => p.status === ProductStatus.PENDING).length;
        const approvedProducts = products.filter(p => p.status === ProductStatus.APPROVED).length;
        const rejectedProducts = products.filter(p => p.status === ProductStatus.REJECTED).length;

        return {
          totalProducts,
          pendingProducts,
          approvedProducts,
          rejectedProducts
        };
      })
    );
  }
}