import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { Category } from '../models/category.model';
import { Product, ProductStatus } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly STORAGE_KEY = 'produits';
  private readonly CATEGORIES_STORAGE_KEY = 'categories';
  private productsSubject = new BehaviorSubject<Product[]>([]);
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public products$ = this.productsSubject.asObservable();
  public categories$ = this.categoriesSubject.asObservable();

  constructor() {
    this.loadProducts();
    this.loadCategories();
  }

  // Récupérer tous les produits depuis localStorage
  getProducts(): Observable<Product[]> {
    return this.products$;
  }

  // Ajouter un produit dans localStorage
  addProduct(product: Product): Observable<Product> {
    const currentProducts = this.productsSubject.value;

    // Générer un nouvel ID basé sur le timestamp
    const newProduct: Product = {
      ...product,
      id: Date.now(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedProducts = [...currentProducts, newProduct];
    this.productsSubject.next(updatedProducts);
    this.saveProductsToStorage(updatedProducts);

    return of(newProduct);
  }

  // Méthode privée pour sauvegarder dans localStorage
  private saveProductsToStorage(products: Product[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde dans localStorage:', error);
    }
  }

  // Méthode privée pour charger depuis localStorage
  private loadProducts(): void {
    try {
      const storedProducts = localStorage.getItem(this.STORAGE_KEY);
      if (storedProducts) {
        const products = JSON.parse(storedProducts) as Product[];
        this.productsSubject.next(products);
      }
    } catch (error) {
      console.error('Erreur lors du chargement depuis localStorage:', error);
      this.productsSubject.next([]);
    }
  }

  // Récupérer les catégories depuis localStorage
  getCategories(): Observable<Category[]> {
    return this.categories$;
  }

  // Récupérer les produits d'un vendeur spécifique
  getProductsBySeller(sellerId: number): Observable<Product[]> {
    const currentProducts = this.productsSubject.value;
    const sellerProducts = currentProducts.filter(product => product.sellerId === sellerId);
    return of(sellerProducts);
  }

  // Supprimer un produit
  deleteProduct(productId: number): Observable<void> {
    const currentProducts = this.productsSubject.value;
    const updatedProducts = currentProducts.filter(product => product.id !== productId);
    this.productsSubject.next(updatedProducts);
    this.saveProductsToStorage(updatedProducts);
    return of(void 0);
  }

  // Méthode privée pour charger les catégories depuis localStorage
  private loadCategories(): void {
    try {
      const storedCategories = localStorage.getItem(this.CATEGORIES_STORAGE_KEY);
      if (storedCategories) {
        const categories = JSON.parse(storedCategories) as Category[];
        this.categoriesSubject.next(categories);
      } else {
        // Si aucune catégorie n'existe, créer des catégories par défaut
        this.initializeDefaultCategories();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      this.initializeDefaultCategories();
    }
  }

  // Initialiser les catégories par défaut
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
    this.saveCategoriesToStorage(defaultCategories);
  }

  // Méthode privée pour sauvegarder les catégories dans localStorage
  private saveCategoriesToStorage(categories: Category[]): void {
    try {
      localStorage.setItem(this.CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des catégories:', error);
    }
  }
}