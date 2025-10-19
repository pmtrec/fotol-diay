import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductService, Produit } from '../../../../core/services/product.service';
import { AIValidationStatus } from '../../../../core/models/product.model';

@Component({
  selector: 'app-admin-validation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-validation.component.html',
  styleUrl: './admin-validation.component.scss'
})
export class AdminValidationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  produitsEnAttente: Produit[] = [];
  isLoading = false;
  showRealPhotoModal = false;
  selectedProductForModal: Produit | null = null;
  actionMessage = '';
  actionMessageType: 'success' | 'error' = 'success';

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProduitsEnAttente();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProduitsEnAttente(): void {
    this.isLoading = true;

    this.productService.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (produits) => {
          console.log('Tous les produits reçus:', produits);

          // Filtrer les produits en attente et les trier par date d'ajout (du plus récent au plus ancien)
          this.produitsEnAttente = produits
            .filter(p => p.status === 'pending')
            .sort((a, b) => {
              const dateA = new Date(a.createdAt || a.createdAt || 0).getTime();
              const dateB = new Date(b.createdAt || b.createdAt || 0).getTime();
              return dateB - dateA;
            });

          console.log('Produits en attente trouvés:', this.produitsEnAttente);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des produits:', error);
          this.isLoading = false;
        }
      });
  }

  approuverProduit(produit: Produit): void {
    if (!produit.id) return;
    this.productService.updateProductStatus(produit.id, 'approved')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedProduct) => {
          if (updatedProduct) {
            this.showMessage('Produit approuvé avec succès', 'success');
            this.loadProduitsEnAttente(); // Recharger la liste
          }
        },
        error: (error) => {
          console.error('Erreur lors de l\'approbation:', error);
          this.showMessage('Erreur lors de l\'approbation du produit', 'error');
        }
      });
  }

  /**
   * Approuver un produit malgré la validation IA négative
   */
  approuverProduitForce(produit: Produit): void {
    if (!produit.id) return;

    const confirmation = confirm(
      'Êtes-vous sûr de vouloir approuver ce produit ? La validation IA a détecté du contenu potentiellement inapproprié.'
    );

    if (confirmation) {
      this.productService.updateProductStatus(produit.id, 'approved')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedProduct) => {
            if (updatedProduct) {
              this.showMessage('Produit approuvé manuellement avec succès', 'success');
              this.loadProduitsEnAttente();
            }
          },
          error: (error) => {
            console.error('Erreur lors de l\'approbation forcée:', error);
            this.showMessage('Erreur lors de l\'approbation du produit', 'error');
          }
        });
    }
  }

  rejeterProduit(produit: Produit): void {
    // Demander la raison du rejet à l'administrateur
    const raison = prompt('Veuillez saisir la raison du rejet (optionnel):');
    if (produit.id) {
      this.productService.updateProductStatus(produit.id, 'rejected', raison || undefined)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedProduct) => {
            if (updatedProduct) {
              this.showMessage('Produit rejeté', 'success');
              this.loadProduitsEnAttente(); // Recharger la liste
            }
          },
          error: (error) => {
            console.error('Erreur lors du rejet:', error);
            this.showMessage('Erreur lors du rejet du produit', 'error');
          }
        });
    }
  }

  modifierProduit(produit: Produit): void {
    // Naviguer vers la page de modification de produit avec l'ID du produit
    if (produit.id) {
      this.router.navigate(['/admin/products/edit', produit.id]);
    }
  }

  openRealPhotoModal(produit: Produit): void {
    this.selectedProductForModal = produit;
    this.showRealPhotoModal = true;
  }

  closeRealPhotoModal(): void {
    this.showRealPhotoModal = false;
    this.selectedProductForModal = null;
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.actionMessage = message;
    this.actionMessageType = type;

    // Cacher le message après 3 secondes
    setTimeout(() => {
      this.actionMessage = '';
    }, 3000);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getVendeurInfo(vendeurId?: string): string {
    // Simulation - à remplacer par un vrai service utilisateur
    return vendeurId ? `Vendeur #${vendeurId}` : 'Vendeur inconnu';
  }

  getMainImage(images: string[]): string {
    return images && images.length > 0 ? images[0] : 'assets/images/no-image.png';
  }

  /**
   * Obtenir le statut de validation IA avec classe CSS
   */
  getAIValidationStatusClass(produit: Produit): string {
    if (!produit.aiValidationStatus) return 'ai-status-none';

    switch (produit.aiValidationStatus) {
      case AIValidationStatus.APPROVED:
        return 'ai-status-approved';
      case AIValidationStatus.REJECTED:
        return 'ai-status-rejected';
      case AIValidationStatus.PENDING:
        return 'ai-status-pending';
      case AIValidationStatus.ERROR:
        return 'ai-status-error';
      default:
        return 'ai-status-none';
    }
  }

  /**
   * Obtenir le texte du statut de validation IA
   */
  getAIValidationStatusText(produit: Produit): string {
    if (!produit.aiValidationStatus) return 'Non analysé';

    switch (produit.aiValidationStatus) {
      case AIValidationStatus.APPROVED:
        return 'Approuvé par IA';
      case AIValidationStatus.REJECTED:
        return 'Rejeté par IA';
      case AIValidationStatus.PENDING:
        return 'En cours d\'analyse';
      case AIValidationStatus.ERROR:
        return 'Erreur d\'analyse';
      default:
        return 'Statut inconnu';
    }
  }

  /**
   * Vérifier si le produit nécessite une attention particulière de l'admin
   */
  needsAdminAttention(produit: Produit): boolean {
    return produit.aiValidationStatus === AIValidationStatus.REJECTED ||
           produit.aiValidationStatus === AIValidationStatus.ERROR ||
           !produit.aiValidationStatus;
  }

  /**
   * Obtenir la raison de rejet IA si disponible
   */
  getAIRejectionReason(produit: Produit): string {
    return produit.aiValidationReason || 'Aucune raison spécifiée';
  }

  /**
   * Obtenir le niveau de confiance de la validation IA
   */
  getAIConfidenceText(produit: Produit): string {
    if (!produit.aiValidationConfidence) return '';
    const percentage = Math.round(produit.aiValidationConfidence * 100);
    return `${percentage}% de confiance`;
  }
}