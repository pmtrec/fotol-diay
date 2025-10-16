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
  produitsFiltres: Produit[] = [];
  isLoading = false;
  showRealPhotoModal = false;
  selectedProductForModal: Produit | null = null;
  filtreActif: 'tous' | 'pending' | 'approved' | 'rejected' = 'tous';

  // Mock vendeur ID - à remplacer par le service d'authentification
  vendeurId = 2;

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
          // Trier les produits par date d'ajout (du plus récent au plus ancien)
          this.produits = produits.sort((a, b) => {
            return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
          });
          this.appliquerFiltre();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des produits:', error);
          this.isLoading = false;
        }
      });
  }

 changerFiltre(filtre: 'tous' | 'pending' | 'approved' | 'rejected'): void {
   this.filtreActif = filtre;
   this.appliquerFiltre();
 }

 private appliquerFiltre(): void {
   switch (this.filtreActif) {
     case 'tous':
       this.produitsFiltres = this.produits;
       break;
     case 'pending':
       this.produitsFiltres = this.produits.filter(p =>
         p.status?.toLowerCase() === 'pending'
       );
       break;
     case 'approved':
       this.produitsFiltres = this.produits.filter(p =>
         p.status?.toLowerCase() === 'approved'
       );
       break;
     case 'rejected':
       this.produitsFiltres = this.produits.filter(p =>
         p.status?.toLowerCase() === 'rejected'
       );
       break;
   }
 }

 getNombreProduitsParStatut(statut: 'tous' | 'pending' | 'approved' | 'rejected'): number {
   switch (statut) {
     case 'tous':
       return this.produits.length;
     case 'pending':
       return this.produits.filter(p =>
         p.status?.toLowerCase() === 'pending'
       ).length;
     case 'approved':
       return this.produits.filter(p =>
         p.status?.toLowerCase() === 'approved'
       ).length;
     case 'rejected':
       return this.produits.filter(p =>
         p.status?.toLowerCase() === 'rejected'
       ).length;
   }
   return 0;
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

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price) + ' F CFA';
  }

  getMainImage(images: string[]): string {
    return images && images.length > 0 ? images[0] : 'assets/images/no-image.png';
  }
}