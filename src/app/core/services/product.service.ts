import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { Category } from '../models/category.model';
import { SupabaseService } from './supabase.service';
import { NotificationService } from './notification.service';
import { NotificationType, NotificationCategory, NotificationPriority } from '../models/notification.model';

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
  sellerId: string;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
  validatedBy?: number;
  validatedAt?: string;
  rejectionReason?: string;

  // Nouveaux champs pour la validation IA
  aiValidationStatus?: 'pending' | 'approved' | 'rejected' | 'error';
  aiValidationDate?: string;
  aiValidationReason?: string;
  aiValidationConfidence?: number;
  aiFlaggedCategories?: string[];

  // Statistics for dashboard
  views?: number;
  contactClicks?: number;
  addToCartClicks?: number;
  whatsappClicks?: number;
}

// Interface pour la création/modification de produit
export interface ProduitCreate {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  sellerId: string;
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

  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService
  ) {
    this.loadProducts();
    this.loadCategories();
  }

  // Récupérer tous les produits depuis Supabase
  getProducts(): Observable<Produit[]> {
    return new Observable(observer => {
      this.supabaseService.client
        .from('products')
        .select('*')
        .then(({ data, error }) => {
          if (error) {
            observer.error(error);
          } else {
            observer.next(data as Produit[]);
            observer.complete();
          }
        });
    });
  }

  // Récupérer les produits d'un vendeur spécifique
  getProductsByVendeur(vendeurId?: string): Observable<Produit[]> {
    return new Observable(observer => {
      let query = this.supabaseService.client.from('products').select('*');

      if (vendeurId) {
        query = query.eq('sellerId', vendeurId);
      }

      query.then(({ data, error }) => {
        if (error) {
          observer.error(error);
        } else {
          observer.next(data as Produit[]);
          observer.complete();
        }
      });
    });
  }

  // Récupérer un produit par son ID
  getProductById(id: string): Observable<Produit> {
    if (!id || id.trim().length === 0) {
      return throwError(() => new Error('Identifiant de produit invalide'));
    }

    return new Observable(observer => {
      this.supabaseService.client
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            observer.error(new Error(error.message || 'Produit non trouvé'));
          } else {
            observer.next(data as Produit);
            observer.complete();
          }
        });
    });
  }

  // Ajouter un produit via Supabase
  addProduct(product: ProduitCreate): Observable<Produit> {
    // Validation des données avant envoi
    this.validateProductData(product);

    return new Observable(observer => {
      this.supabaseService.client
        .from('products')
        .insert({
          ...product,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            observer.error(new Error(error.message || 'Impossible de créer le produit'));
          } else {
            // Notifier les administrateurs du nouveau produit en attente
            this.notifyAdminsOfNewProduct(data as Produit);
            observer.next(data as Produit);
            observer.complete();
          }
        });
    });
  }

  // Mettre à jour le statut d'un produit
  updateProductStatus(id: string, status: Produit['status'], rejectionReason?: string): Observable<Produit> {
    // Validation du statut
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return throwError(() => new Error('Statut invalide. Utilisez: pending, approved, ou rejected'));
    }

    // Validation de la raison de rejet
    if (status === 'rejected' && (!rejectionReason || rejectionReason.trim().length < 5)) {
      return throwError(() => new Error('Une raison de rejet d\'au moins 5 caractères est requise'));
    }

    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
      validatedBy: 1, // Admin ID - à remplacer par le service d'auth
      validatedAt: new Date().toISOString()
    };

    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason.trim();
    }

    return new Observable(observer => {
      this.supabaseService.client
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            observer.error(new Error(error.message || 'Impossible de mettre à jour le statut'));
          } else {
            // Notifier le vendeur du changement de statut
            this.notifySellerOfProductStatusChange(data as Produit, status, rejectionReason);
            observer.next(data as Produit);
            observer.complete();
          }
        });
    });
  }

  /**
   * Workflow d'approbation intégré avec validation IA
   * Cette méthode gère automatiquement l'approbation basée sur le statut IA
   */
  approveProductWithAIValidation(id: string, adminOverride: boolean = false): Observable<Produit> {
    // D'abord récupérer le produit pour vérifier son statut IA
    return this.getProductById(id).pipe(
      switchMap(product => {
        // Logique de workflow d'approbation
        if (product.aiValidationStatus === 'rejected' && !adminOverride) {
          // Retourner une erreur pour les produits rejetés sans override admin
          return throwError(() => new Error('Ce produit a été rejeté par l\'IA et nécessite une approbation manuelle forcée.'));
        }

        if (product.aiValidationStatus === 'approved' || adminOverride) {
          // Approuver automatiquement si l'IA a approuvé ou si l'admin force l'approbation
          return this.updateProductStatus(id, 'approved');
        }

        // Pour les autres cas (pending, error), soumettre pour approbation manuelle
        return this.updateProductStatus(id, 'pending', 'En attente de validation manuelle après analyse IA');
      })
    );
  }

  /**
   * Obtenir les produits nécessitant une attention particulière
   * (rejetés par IA ou sans validation IA)
   */
  getProductsNeedingAttention(): Observable<Produit[]> {
    return this.getProducts().pipe(
      map(products => products.filter(product =>
        product.aiValidationStatus === 'rejected' ||
        product.aiValidationStatus === 'error' ||
        !product.aiValidationStatus
      ))
    );
  }

  /**
   * Obtenir les statistiques de validation IA
   */
  getAIValidationStats(): Observable<{
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    error: number;
    noValidation: number;
  }> {
    return this.getProducts().pipe(
      map(products => {
        const stats = {
          total: products.length,
          approved: 0,
          rejected: 0,
          pending: 0,
          error: 0,
          noValidation: 0
        };

        products.forEach(product => {
          switch (product.aiValidationStatus) {
            case 'approved':
              stats.approved++;
              break;
            case 'rejected':
              stats.rejected++;
              break;
            case 'pending':
              stats.pending++;
              break;
            case 'error':
              stats.error++;
              break;
            default:
              stats.noValidation++;
          }
        });

        return stats;
      })
    );
  }

  // Mettre à jour un produit (tous les champs sauf l'ID)
  updateProduct(id: string, productData: Partial<Omit<Produit, 'id'>>): Observable<Produit> {
    // Validation des données avant mise à jour
    if (Object.keys(productData).length === 0) {
      return throwError(() => new Error('Aucune donnée fournie pour la mise à jour'));
    }

    // Sanitiser les données
    const sanitizedData = this.sanitizeProductData(productData);

    // Valider les données si elles contiennent des champs critiques
    if (sanitizedData.name || sanitizedData.description || sanitizedData.price || sanitizedData.stock) {
      this.validateProductData(sanitizedData as ProduitCreate);
    }

    const updateData = {
      ...sanitizedData,
      updatedAt: new Date().toISOString()
    };

    return new Observable(observer => {
      this.supabaseService.client
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            observer.error(new Error(error.message || 'Impossible de mettre à jour le produit'));
          } else {
            observer.next(data as Produit);
            observer.complete();
          }
        });
    });
  }

  // Supprimer un produit
  deleteProduct(id: string): Observable<void> {
    if (!id || id.trim().length === 0) {
      return throwError(() => new Error('Identifiant de produit invalide'));
    }

    return new Observable(observer => {
      this.supabaseService.client
        .from('products')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            observer.error(new Error(error.message || 'Impossible de supprimer le produit'));
          } else {
            observer.next();
            observer.complete();
          }
        });
    });
  }

  // Récupérer les catégories depuis Supabase
  getCategories(): Observable<Category[]> {
    return new Observable(observer => {
      this.supabaseService.client
        .from('categories')
        .select('*')
        .then(({ data, error }) => {
          if (error) {
            observer.error(error);
          } else {
            observer.next(data as Category[]);
            observer.complete();
          }
        });
    });
  }

  // Créer une nouvelle catégorie
  createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'productCount'>): Observable<Category> {
    const newCategory = {
      ...category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      productCount: 0
    };
    return new Observable(observer => {
      this.supabaseService.client
        .from('categories')
        .insert(newCategory)
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            observer.error(new Error(error.message || 'Impossible de créer la catégorie'));
          } else {
            observer.next(data as Category);
            observer.complete();
          }
        });
    });
  }

  // Mettre à jour une catégorie existante
  updateCategory(id: string, category: Partial<Category>): Observable<Category> {
    const updatedCategory = {
      ...category,
      updatedAt: new Date().toISOString()
    };
    return new Observable(observer => {
      this.supabaseService.client
        .from('categories')
        .update(updatedCategory)
        .eq('id', id)
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            observer.error(new Error(error.message || 'Impossible de mettre à jour la catégorie'));
          } else {
            observer.next(data as Category);
            observer.complete();
          }
        });
    });
  }

  // Supprimer une catégorie
  deleteCategory(id: string): Observable<void> {
    return new Observable(observer => {
      this.supabaseService.client
        .from('categories')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            observer.error(new Error(error.message || 'Impossible de supprimer la catégorie'));
          } else {
            observer.next();
            observer.complete();
          }
        });
    });
  }

  // Méthode privée pour charger les produits depuis Supabase
  private loadProducts(): void {
    this.supabaseService.client
      .from('products')
      .select('*')
      .then(({ data, error }) => {
        if (error) {
          console.error('Erreur lors du chargement des produits depuis Supabase:', error);
          this.productsSubject.next([]);
        } else {
          this.productsSubject.next(data as Produit[]);
        }
      });
  }

  // Méthode privée pour charger les catégories depuis Supabase
  private loadCategories(): void {
    this.supabaseService.client
      .from('categories')
      .select('*')
      .then(({ data, error }) => {
        if (error) {
          console.error('Erreur lors du chargement des catégories depuis Supabase:', error);
          this.initializeDefaultCategories();
        } else {
          this.categoriesSubject.next(data as Category[]);
        }
      });
  }

  // Initialiser les catégories par défaut (fallback)
  private initializeDefaultCategories(): void {
    const defaultCategories: Category[] = [
      {
        id: 'cat-electronique-1',
        name: 'Électronique',
        description: 'Produits électroniques et gadgets',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        productCount: 0
      },
      {
        id: 'cat-vetements-2',
        name: 'Vêtements',
        description: 'Articles vestimentaires',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        productCount: 0
      },
      {
        id: 'cat-maison-3',
        name: 'Maison',
        description: 'Articles pour la maison',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        productCount: 0
      },
      {
        id: 'cat-sports-4',
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
  getProductsByVendeurOld(vendeurId?: string): Observable<any[]> {
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

    return new Observable(observer => {
      this.supabaseService.client
        .from('products')
        .insert({
          ...newProduct,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            observer.error(new Error(error.message || 'Impossible de créer le produit'));
          } else {
            observer.next(this.transformProduitToOld(data as Produit));
            observer.complete();
          }
        });
    });
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

  // Update product statistics
  updateProductStatistic(id: string, statistic: string, value: number): Observable<Produit> {
    const updateData = {
      [statistic]: value,
      updatedAt: new Date().toISOString()
    };
    return new Observable(observer => {
      this.supabaseService.client
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            observer.error(new Error(error.message || 'Impossible de mettre à jour les statistiques'));
          } else {
            observer.next(data as Produit);
            observer.complete();
          }
        });
    });
  }

  // =================== VALIDATION METHODS ===================

  /**
   * Valider les données d'un produit avant création/modification
   */
  private validateProductData(product: ProduitCreate | Partial<Produit>): void {
    const errors: string[] = [];

    // Validation du nom
    if (!product.name || product.name.trim().length < 3) {
      errors.push('Le nom du produit doit contenir au moins 3 caractères');
    }

    // Validation de la description
    if (!product.description || product.description.trim().length < 10) {
      errors.push('La description doit contenir au moins 10 caractères');
    }

    // Validation du prix
    if (!product.price || product.price <= 0) {
      errors.push('Le prix doit être supérieur à 0');
    }

    // Validation du stock
    if (typeof product.stock !== 'number' || product.stock < 0) {
      errors.push('Le stock doit être un nombre positif ou nul');
    }

    // Validation de la catégorie
    if (!product.category || product.category.trim().length === 0) {
      errors.push('La catégorie est obligatoire');
    }

    // Validation des images
    if (!product.images || product.images.length === 0) {
      errors.push('Au moins une image est requise');
    }

    // Validation du vendeur
    if (!product.sellerId || product.sellerId.trim().length === 0) {
      errors.push('L\'identifiant du vendeur est invalide');
    }

    // Vérification du contenu inapproprié (mots interdits)
    const forbiddenWords = ['prono', 'sexuel', 'pornographique', 'inapproprié'];
    const productText = `${product.name} ${product.description}`.toLowerCase();

    for (const word of forbiddenWords) {
      if (productText.includes(word)) {
        errors.push('Le contenu du produit contient des termes inappropriés');
        break;
      }
    }

    if (errors.length > 0) {
      throw new Error(`Erreurs de validation:\n${errors.join('\n')}`);
    }
  }

  /**
   * Nettoyer et sanitiser les données du produit
   */
  private sanitizeProductData(product: ProduitCreate | Partial<Produit>): ProduitCreate | Partial<Produit> {
    return {
      ...product,
      name: product.name?.trim(),
      description: product.description?.trim(),
      category: product.category?.trim()
    };
  }

  // =================== NOTIFICATION METHODS ===================

  /**
   * Notifier les administrateurs d'un nouveau produit en attente
   */
  private notifyAdminsOfNewProduct(product: Produit): void {
    // Créer une notification pour tous les administrateurs
    const notification = {
      userId: 'admin-1', // ID admin par défaut - à remplacer par une vraie logique de récupération des admins
      type: NotificationType.SYSTEM_UPDATE,
      title: 'Nouveau produit en attente',
      message: `Le produit "${product.name}" a été ajouté par un vendeur et nécessite votre validation.`,
      read: false,
      priority: NotificationPriority.HIGH,
      category: NotificationCategory.PRODUCTS,
      data: {
        productId: product.id || '0',
        productName: product.name,
        sellerId: product.sellerId,
        actionRequired: true
      }
    };

    // Envoyer la notification
    this.notificationService.createNotification(notification).subscribe({
      next: (createdNotification) => {
        console.log('Notification envoyée aux administrateurs:', createdNotification);
      },
      error: (error) => {
        console.error('Erreur lors de l\'envoi de la notification:', error);
      }
    });
  }

  /**
   * Notifier le vendeur du changement de statut de son produit
   */
  private notifySellerOfProductStatusChange(product: Produit, status: Produit['status'], rejectionReason?: string): void {
    let notificationType: NotificationType;
    let title: string;
    let message: string;

    switch (status) {
      case 'approved':
        notificationType = NotificationType.PRODUCT_APPROVED;
        title = 'Produit approuvé';
        message = `Votre produit "${product.name}" a été approuvé par l'administrateur et est maintenant visible dans le catalogue.`;
        break;
      case 'rejected':
        notificationType = NotificationType.PRODUCT_REJECTED;
        title = 'Produit rejeté';
        message = `Votre produit "${product.name}" a été rejeté par l'administrateur.${rejectionReason ? ` Raison: ${rejectionReason}` : ''}`;
        break;
      default:
        return; // Ne pas notifier pour les autres statuts
    }

    const notification = {
      userId: product.sellerId,
      type: notificationType,
      title,
      message,
      read: false,
      priority: status === 'approved' ? NotificationPriority.NORMAL : NotificationPriority.HIGH,
      category: NotificationCategory.PRODUCTS,
      data: {
        productId: product.id || '0',
        productName: product.name,
        status,
        rejectionReason
      }
    };

    // Envoyer la notification au vendeur
    this.notificationService.createNotification(notification).subscribe({
      next: (createdNotification) => {
        console.log('Notification envoyée au vendeur:', createdNotification);
      },
      error: (error) => {
        console.error('Erreur lors de l\'envoi de la notification au vendeur:', error);
      }
    });
  }
}
