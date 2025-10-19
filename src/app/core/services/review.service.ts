import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  Review,
  ReviewStatus,
  ReviewFilters,
  ProductReviewStats,
  CreateReviewRequest,
  ReviewHelpfulAction,
  ReviewReport,
  ReportReason,
  SellerReviewStats
} from '../models/review.model';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private reviewsSubject = new BehaviorSubject<Review[]>([]);
  private reviewStatsSubject = new BehaviorSubject<ProductReviewStats | null>(null);

  public reviews$ = this.reviewsSubject.asObservable();
  public reviewStats$ = this.reviewStatsSubject.asObservable();

  constructor(private apiService: ApiService) {}

  // =================== REVIEWS PRODUITS ===================

  /**
   * Créer une nouvelle review
   */
  createReview(reviewRequest: CreateReviewRequest): Observable<Review> {
    return this.apiService.post<Review>('/reviews', {
      ...reviewRequest,
      status: ReviewStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).pipe(
      tap(review => {
        this.refreshReviews();
        this.updateReviewStats(review.productId);
      })
    );
  }

  /**
   * Récupérer les reviews d'un produit
   */
  getProductReviews(productId: string, filters?: ReviewFilters): Observable<Review[]> {
    let params = `?productId=${productId}`;
    if (filters) {
      const searchParams = new URLSearchParams();
      if (filters.rating?.length) searchParams.append('rating', filters.rating.join(','));
      if (filters.verified !== undefined) searchParams.append('verified', filters.verified.toString());
      if (filters.withImages !== undefined) searchParams.append('withImages', filters.withImages.toString());
      if (filters.status) searchParams.append('status', filters.status.join(','));
      if (filters.dateFrom) searchParams.append('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) searchParams.append('dateTo', filters.dateTo.toISOString());
      if (filters.search) searchParams.append('search', filters.search);
      params += '&' + searchParams.toString();
    }

    return this.apiService.get<Review[]>(`/reviews${params}`);
  }

  /**
   * Récupérer les statistiques d'un produit
   */
  getProductReviewStats(productId: string): Observable<ProductReviewStats> {
    return this.apiService.get<ProductReviewStats>(`/reviews/stats/${productId}`);
  }

  /**
   * Mettre à jour une review (client uniquement pour ses propres reviews)
   */
  updateReview(reviewId: number, updates: Partial<Review>): Observable<Review> {
    return this.apiService.patch<Review>(`/reviews/${reviewId}`, {
      ...updates,
      updatedAt: new Date().toISOString()
    }).pipe(
      tap(review => {
        this.refreshReviews();
        this.updateReviewStats(review.productId);
      })
    );
  }

  /**
   * Supprimer une review
   */
  deleteReview(reviewId: number): Observable<void> {
    return this.apiService.delete<void>(`/reviews/${reviewId}`).pipe(
      tap(() => {
        this.refreshReviews();
      })
    );
  }

  // =================== MODÉRATION ADMIN ===================

  /**
   * Approuver une review (admin)
   */
  approveReview(reviewId: number): Observable<Review> {
    return this.updateReviewStatus(reviewId, ReviewStatus.APPROVED);
  }

  /**
   * Rejeter une review (admin)
   */
  rejectReview(reviewId: number, reason?: string): Observable<Review> {
    return this.updateReviewStatus(reviewId, ReviewStatus.REJECTED, reason);
  }

  /**
   * Masquer une review (admin)
   */
  hideReview(reviewId: number, reason?: string): Observable<Review> {
    return this.updateReviewStatus(reviewId, ReviewStatus.HIDDEN, reason);
  }

  /**
   * Mettre à jour le statut d'une review (admin)
   */
  private updateReviewStatus(reviewId: number, status: ReviewStatus, reason?: string): Observable<Review> {
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (reason) updateData.moderationReason = reason;

    return this.apiService.patch<Review>(`/reviews/${reviewId}/status`, updateData).pipe(
      tap(review => {
        this.refreshReviews();
        this.updateReviewStats(review.productId);
      })
    );
  }

  // =================== INTERACTIONS UTILISATEURS ===================

  /**
   * Marquer une review comme utile
   */
  markReviewHelpful(reviewId: number, userId: string, helpful: boolean): Observable<void> {
    return this.apiService.post<void>(`/reviews/${reviewId}/helpful`, {
      userId,
      helpful
    });
  }

  /**
   * Signaler une review
   */
  reportReview(reviewId: number, userId: string, reason: ReportReason, description?: string): Observable<ReviewReport> {
    return this.apiService.post<ReviewReport>(`/reviews/${reviewId}/report`, {
      reportedBy: userId,
      reason,
      description
    });
  }

  // =================== RÉPONSES VENDEUR ===================

  /**
   * Répondre à une review (vendeur)
   */
  respondToReview(reviewId: number, sellerId: string, comment: string): Observable<Review> {
    return this.apiService.post<Review>(`/reviews/${reviewId}/response`, {
      sellerId,
      comment,
      createdAt: new Date().toISOString()
    }).pipe(
      tap(review => {
        this.refreshReviews();
        this.updateReviewStats(review.productId);
      })
    );
  }

  /**
   * Mettre à jour une réponse (vendeur)
   */
  updateReviewResponse(reviewId: number, responseId: number, comment: string): Observable<Review> {
    return this.apiService.patch<Review>(`/reviews/${reviewId}/response/${responseId}`, {
      comment,
      updatedAt: new Date().toISOString()
    }).pipe(
      tap(review => {
        this.refreshReviews();
      })
    );
  }

  /**
   * Supprimer une réponse (vendeur)
   */
  deleteReviewResponse(reviewId: number, responseId: number): Observable<Review> {
    return this.apiService.delete<Review>(`/reviews/${reviewId}/response/${responseId}`).pipe(
      tap(review => {
        this.refreshReviews();
      })
    );
  }

  // =================== STATISTIQUES VENDEUR ===================

  /**
   * Récupérer les statistiques de reviews d'un vendeur
   */
  getSellerReviewStats(sellerId: string): Observable<SellerReviewStats> {
    return this.apiService.get<SellerReviewStats>(`/reviews/seller-stats/${sellerId}`);
  }

  /**
   * Récupérer les reviews en attente de réponse (vendeur)
   */
  getPendingResponseReviews(sellerId: string): Observable<Review[]> {
    return this.apiService.get<Review[]>(`/reviews/pending-response?sellerId=${sellerId}`);
  }

  // =================== FONCTIONS DE RECHERCHE ===================

  /**
   * Rechercher des reviews
   */
  searchReviews(query: string, filters?: ReviewFilters): Observable<Review[]> {
    let params = `?search=${encodeURIComponent(query)}`;
    if (filters) {
      const searchParams = new URLSearchParams();
      if (filters.rating?.length) searchParams.append('rating', filters.rating.join(','));
      if (filters.verified !== undefined) searchParams.append('verified', filters.verified.toString());
      if (filters.status) searchParams.append('status', filters.status.join(','));
      params += '&' + searchParams.toString();
    }

    return this.apiService.get<Review[]>(`/reviews/search${params}`);
  }

  /**
   * Récupérer les reviews récentes
   */
  getRecentReviews(limit: number = 10): Observable<Review[]> {
    return this.apiService.get<Review[]>(`/reviews/recent?limit=${limit}`);
  }

  // =================== FONCTIONS PRIVÉES ===================

  private refreshReviews(): void {
    // Recharger les reviews depuis l'API
    this.apiService.get<Review[]>('/reviews').subscribe({
      next: (reviews) => {
        this.reviewsSubject.next(reviews);
      },
      error: (error) => {
        console.error('Erreur lors du rechargement des reviews:', error);
      }
    });
  }

  private updateReviewStats(productId: string): void {
    this.getProductReviewStats(productId).subscribe({
      next: (stats) => {
        this.reviewStatsSubject.next(stats);
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour des statistiques:', error);
      }
    });
  }

  // =================== FONCTIONS DE VALIDATION ===================

  /**
   * Valider une review avant création
   */
  validateReview(reviewRequest: CreateReviewRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (reviewRequest.rating < 1 || reviewRequest.rating > 5) {
      errors.push('La notation doit être entre 1 et 5 étoiles');
    }

    if (!reviewRequest.title.trim()) {
      errors.push('Le titre est requis');
    }

    if (!reviewRequest.comment.trim()) {
      errors.push('Le commentaire est requis');
    }

    if (reviewRequest.title.length < 5) {
      errors.push('Le titre doit contenir au moins 5 caractères');
    }

    if (reviewRequest.comment.length < 10) {
      errors.push('Le commentaire doit contenir au moins 10 caractères');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Générer les étoiles pour l'affichage
   */
  getStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  /**
   * Formater la date pour l'affichage
   */
  formatReviewDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Obtenir la classe CSS pour le statut
   */
  getStatusClass(status: ReviewStatus): string {
    const classes = {
      [ReviewStatus.PENDING]: 'status-pending',
      [ReviewStatus.APPROVED]: 'status-approved',
      [ReviewStatus.REJECTED]: 'status-rejected',
      [ReviewStatus.FLAGGED]: 'status-flagged',
      [ReviewStatus.HIDDEN]: 'status-hidden'
    };
    return classes[status] || '';
  }

  /**
   * Obtenir le libellé du statut
   */
  getStatusLabel(status: ReviewStatus): string {
    const labels = {
      [ReviewStatus.PENDING]: 'En attente de modération',
      [ReviewStatus.APPROVED]: 'Approuvé',
      [ReviewStatus.REJECTED]: 'Rejeté',
      [ReviewStatus.FLAGGED]: 'Signalé',
      [ReviewStatus.HIDDEN]: 'Masqué'
    };
    return labels[status] || status;
  }
}