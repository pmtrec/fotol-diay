import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Category } from '../models/category.model';
import { ApiService } from './api.service';

// Interface Produit qui correspond exactement à db.json
export interface Produit {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  sellerId: number;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
  validatedBy?: number;
  validatedAt?: string;
  rejectionReason?: string;
}

// Interface pour la création/modification de produit
export interface ProduitCreate {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  sellerId: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly STORAGE_KEY = 'produits';
  private readonly CATEGORIES_STORAGE_KEY = 'categories';
  private productsSubject = new BehaviorSubject<Produit[]>([]);
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public products$ = this.productsSubject.asObservable();
  public categories$ = this.categoriesSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadProducts();
    this.loadCategories();
  }

  // Récupérer tous les produits depuis l'API JSON Server
  getProducts(): Observable<Produit[]> {
    return this.apiService.get<Produit[]>('/products');
  }

  // Récupérer les produits d'un vendeur spécifique
  getProductsByVendeur(vendeurId?: number): Observable<Produit[]> {
    if (vendeurId) {
      return this.apiService.get<Produit[]>(`/products?sellerId=${vendeurId}`);
    }
    return this.apiService.get<Produit[]>('/products');
  }

  // Récupérer un produit par son ID
  getProductById(id: string): Observable<Produit> {
    return this.apiService.get<Produit>(`/products/${id}`);
  }

  // Ajouter un produit via l'API
  addProduct(product: ProduitCreate): Observable<Produit> {
    return this.apiService.post<Produit>('/products', product);
  }

  // Mettre à jour le statut d'un produit
  updateProductStatus(id: string, status: Produit['status']): Observable<Produit> {
    const updateData = {
      status,
      updatedAt: new Date().toISOString(),
      validatedBy: 1, // Admin ID - à remplacer par le service d'auth
      validatedAt: new Date().toISOString()
    };
    return this.apiService.patch<Produit>(`/products/${id}`, updateData);
  }

  // Supprimer un produit
  deleteProduct(id: string): Observable<void> {
    return this.apiService.delete<void>(`/products/${id}`);
  }

  // Récupérer les catégories depuis l'API
  getCategories(): Observable<Category[]> {
    return this.apiService.get<Category[]>('/categories');
  }

  // Méthode privée pour charger les produits depuis l'API
  private loadProducts(): void {
    this.apiService.get<Produit[]>('/products').subscribe({
      next: (products) => {
        this.productsSubject.next(products);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des produits depuis l\'API:', error);
        this.productsSubject.next([]);
      }
    });
  }

  // Méthode privée pour charger les catégories depuis l'API
  private loadCategories(): void {
    this.apiService.get<Category[]>('/categories').subscribe({
      next: (categories) => {
        this.categoriesSubject.next(categories);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des catégories depuis l\'API:', error);
        this.initializeDefaultCategories();
      }
    });
  }

  // Initialiser les catégories par défaut (fallback)
  private initializeDefaultCategories(): void {
    const defaultCategories: Category[] = [
      {
        id: 1,
        name: 'Électronique',
        description: 'Produits électroniques et gadgets',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        productCount: 0
      },
      {
        id: 2,
        name: 'Vêtements',
        description: 'Articles vestimentaires',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        productCount: 0
      },
      {
        id: 3,
        name: 'Maison',
        description: 'Articles pour la maison',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        productCount: 0
      },
      {
        id: 4,
        name: 'Sports',
        description: 'Équipements sportifs',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        productCount: 0
      }
    ];

    this.categoriesSubject.next(defaultCategories);
  }

  // =================== MÉTHODES DE COMPATIBILITÉ ===================
  // Ces méthodes permettent aux anciens composants de fonctionner
  // pendant la transition vers la nouvelle structure de données

  // Ancienne méthode pour la compatibilité (utilise localStorage temporairement)
  getProductsByVendeurOld(vendeurId?: number): Observable<any[]> {
    const currentProducts = this.productsSubject.value;
    const vendeurProducts = vendeurId
      ? currentProducts.filter(product => product.sellerId === vendeurId)
      : currentProducts;
    return of(vendeurProducts.map(p => this.transformProduitToOld(p)));
  }

  // Transformer le nouveau format vers l'ancien pour la compatibilité
  private transformProduitToOld(produit: Produit): any {
    return {
      id: parseInt(produit.id || '0'),
      nom: produit.name,
      description: produit.description,
      prix: produit.price,
      categorie: produit.category,
      stock: produit.stock,
      imageUrl: produit.images?.[0] || '',
      vendeurId: produit.sellerId,
      statut: produit.status,
      dateAjout: produit.createdAt || new Date().toISOString(),
      images: produit.images || [],
      status: produit.status,
      createdAt: produit.createdAt,
      updatedAt: produit.updatedAt,
      validatedBy: produit.validatedBy,
      validatedAt: produit.validatedAt,
      rejectionReason: produit.rejectionReason
    };
  }

  // Ancienne méthode pour la compatibilité
  addProductOld(product: any): Observable<any> {
    const newProduct: ProduitCreate = {
      name: product.nom,
      description: product.description,
      price: product.prix,
      category: product.categorie,
      stock: product.stock,
      images: product.images || [product.imageUrl],
      sellerId: product.vendeurId || 2
    };

    return this.apiService.post<Produit>('/products', newProduct).pipe(
      map(createdProduct => this.transformProduitToOld(createdProduct))
    );
  }

  // Ancienne méthode pour la compatibilité
  updateProductStatusOld(id: number, statut: string): Observable<any> {
    const productId = id.toString();
    const statusMap: { [key: string]: Produit['status'] } = {
      'pending': 'pending',
      'approved': 'approved',
      'rejected': 'rejected'
    };

    const status = statusMap[statut] || 'pending';

    return this.updateProductStatus(productId, status).pipe(
      map(product => this.transformProduitToOld(product))
    );
  }

  // Ancienne méthode pour la compatibilité
  deleteProductOld(id: number): Observable<boolean> {
    const productId = id.toString();
    return this.deleteProduct(productId).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}