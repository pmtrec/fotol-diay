import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { Category } from '../models/category.model';

// Interface Produit selon les spécifications
export interface Produit {
  id: number;
  nom: string;
  description: string;
  prix: number;
  categorie: string;
  stock: number;
  imageUrl: string;
  vendeurId?: number;
  statut: 'pending' | 'approved' | 'rejected';
  dateAjout: string;
  photoFlouDataUrl?: string;
  photoDataUrl?: string;
  rating?: number;
  images?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  validatedBy?: number;
  validatedAt?: Date;
  rejectionReason?: string;
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

  constructor() {
    this.loadProducts();
    this.loadCategories();
  }

  // Récupérer tous les produits depuis localStorage
  getProducts(): Observable<Produit[]> {
    return this.products$;
  }

  // Récupérer les produits d'un vendeur spécifique
  getProductsByVendeur(vendeurId?: number): Observable<Produit[]> {
    const currentProducts = this.productsSubject.value;
    const vendeurProducts = vendeurId
      ? currentProducts.filter(product => product.vendeurId === vendeurId)
      : currentProducts;
    return of(vendeurProducts);
  }

  // Ajouter un produit dans localStorage
  addProduct(product: Produit): Observable<Produit> {
    const currentProducts = this.productsSubject.value;

    // Générer un nouvel ID basé sur le timestamp
    const newProduct: Produit = {
      ...product,
      id: Date.now(),
      statut: 'pending',
      dateAjout: new Date().toISOString()
    };

    const updatedProducts = [...currentProducts, newProduct];
    this.productsSubject.next(updatedProducts);
    this.saveProductsToStorage(updatedProducts);

    return of(newProduct);
  }

  // Mettre à jour le statut d'un produit
  updateProductStatus(id: number, statut: Produit['statut']): Observable<Produit | null> {
    const currentProducts = this.productsSubject.value;
    const productIndex = currentProducts.findIndex(product => product.id === id);

    if (productIndex === -1) {
      return of(null);
    }

    const updatedProducts = [...currentProducts];
    updatedProducts[productIndex] = {
      ...updatedProducts[productIndex],
      statut
    };

    this.productsSubject.next(updatedProducts);
    this.saveProductsToStorage(updatedProducts);

    return of(updatedProducts[productIndex]);
  }

  // Supprimer un produit
  deleteProduct(id: number): Observable<boolean> {
    const currentProducts = this.productsSubject.value;
    const updatedProducts = currentProducts.filter(product => product.id !== id);

    if (updatedProducts.length === currentProducts.length) {
      return of(false); // Produit non trouvé
    }

    this.productsSubject.next(updatedProducts);
    this.saveProductsToStorage(updatedProducts);

    return of(true);
  }

  // Méthode privée pour sauvegarder dans localStorage
  private saveProductsToStorage(products: Produit[]): void {
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
        const products = JSON.parse(storedProducts) as Produit[];
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