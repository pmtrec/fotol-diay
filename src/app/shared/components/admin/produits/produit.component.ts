import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationModalComponent } from '../../common/confirmation-modal/confirmation-modal.component';

interface Produit {
  id: number;
  name: string;
  price: number;
  quantiteMin: number;
  imageUrl: string;
  images?: string[];
  fournisseur: string;
  verified?: boolean;
  pays?: string;
  annee?: number;
  statut?: string;
  categorie?: string;
  description?: string;
  vendeurId?: number;
  stock?: number;
  isLoading?: boolean;
}

@Component({
  selector: 'app-produits',
  standalone: true,
  imports: [CommonModule, ConfirmationModalComponent],
  templateUrl: './produit.component.html',
  styleUrls: ['./produit.component.scss'],
})
export class ProduitsComponent implements OnInit {
  produits: Produit[] = [];
  isLoading = false;

  // Modal properties
  showDeleteModal = false;
  productToDelete: Produit | null = null;

  ngOnInit() {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.isLoading = true;

    // Simulate API call
    setTimeout(() => {
      this.produits = [
        {
          id: 1,
          name: 'Lunettes de soleil polarisées',
          price: 6000,
          quantiteMin: 10,
          imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
          images: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'],
          fournisseur: 'Danyang Pinhui Optics',
          verified: true,
          pays: 'CN',
          annee: 8,
          statut: 'approved',
          categorie: 'Accessoires',
          description: 'Lunettes de soleil de haute qualité avec protection UV',
          vendeurId: 1,
          stock: 50
        },
        {
          id: 2,
          name: 'Sinotruck 10 roues 40 tonnes',
          price: 3000000,
          quantiteMin: 1,
          imageUrl: 'https://images.unsplash.com/photo-1593941707874-ef25b8b4a92c?auto=format&fit=crop&w=400&q=80',
          images: ['https://images.unsplash.com/photo-1593941707874-ef25b8b4a92c?auto=format&fit=crop&w=400&q=80'],
          fournisseur: 'Jiangxi Weierke',
          verified: true,
          pays: 'CN',
          annee: 2,
          statut: 'pending',
          categorie: 'Véhicules',
          description: 'Camion lourd 10 roues pour transport de marchandises',
          vendeurId: 2,
          stock: 5
        },
        {
          id: 3,
          name: 'Sacs à dos imperméables 2025',
          price: 15000,
          quantiteMin: 50,
          imageUrl: 'https://images.unsplash.com/photo-1598032895144-36d8c72e0c8b?auto=format&fit=crop&w=400&q=80',
          images: ['https://images.unsplash.com/photo-1598032895144-36d8c72e0c8b?auto=format&fit=crop&w=400&q=80'],
          fournisseur: 'Shenzhen Bags Ltd',
          verified: false,
          pays: 'CN',
          annee: 5,
          statut: 'rejected',
          categorie: 'Bagagerie',
          description: 'Sacs à dos résistants à l\'eau pour toutes activités',
          vendeurId: 3,
          stock: 100
        },
      ];
      this.isLoading = false;
    }, 1000);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price) + ' F CFA';
  }

  getMainImage(images: string[]): string {
    return images && images.length > 0 ? images[0] : 'assets/images/no-image.png';
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/no-image.png';
  }

  onFlagError(event: any): void {
    event.target.style.display = 'none';
  }

  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      default: return 'Inconnu';
    }
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  }

  getStatusIcon(statut: string): string {
    switch (statut) {
      case 'pending': return 'fa-clock';
      case 'approved': return 'fa-check-circle';
      case 'rejected': return 'fa-times-circle';
      default: return 'fa-question-circle';
    }
  }

  editProduct(product: Produit): void {
    console.log('Editing product:', product);
  }

  deleteProduct(product: Produit): void {
    this.productToDelete = product;
    this.showDeleteModal = true;
  }

  confirmDeleteProduct(): void {
    if (this.productToDelete) {
      console.log('Deleting product:', this.productToDelete);
      // TODO: Implement actual delete logic with ProductService
      // this.productService.deleteProduct(this.productToDelete.id).subscribe(...)
      this.closeDeleteModal();
    }
  }

  cancelDeleteProduct(): void {
    this.closeDeleteModal();
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.productToDelete = null;
  }

  validateProduct(product: Produit): void {
    console.log('Validating product:', product);
  }

  contactSupplier(product: Produit): void {
    console.log('Contacting supplier for product:', product);
  }
}
