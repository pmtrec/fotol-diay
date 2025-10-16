import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductService, Produit } from '../../../../core/services/product.service';

@Component({
  selector: 'app-mes-produits',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mes-produits.component.html',
  styleUrl: './mes-produits.component.scss'
})
export class MesProduitsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  produits: Produit[] = [];
  isLoading = false;
  showRealPhotoModal = false;
  selectedProductForModal: Produit | null = null;

  // Mock vendeur ID - à remplacer par le service d'authentification
  vendeurId = 1;

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProduits();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProduits(): void {
    this.isLoading = true;

    this.productService.getProductsByVendeur(this.vendeurId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (produits) => {
          this.produits = produits;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des produits:', error);
          this.isLoading = false;
        }
      });
  }

  navigateToAddProduct(): void {
    this.router.navigate(['/produits/ajouter']);
  }

  openRealPhotoModal(produit: Produit): void {
    this.selectedProductForModal = produit;
    this.showRealPhotoModal = true;
  }

  closeRealPhotoModal(): void {
    this.showRealPhotoModal = false;
    this.selectedProductForModal = null;
  }

  getBadgeClass(statut: string): string {
    switch (statut) {
      case 'pending':
        return 'badge--pending';
      case 'approved':
        return 'badge--approved';
      default:
        return '';
    }
  }

  getBadgeText(statut: string): string {
    switch (statut) {
      case 'pending':
        return '🕓 En attente d\'approbation';
      case 'approved':
        return '✅ Approuvé';
      default:
        return 'Inconnu';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}