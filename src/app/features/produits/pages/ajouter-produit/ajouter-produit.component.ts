import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ProductService, Produit } from '../../../../core/services/product.service';
import { Category } from '../../../../core/models/category.model';
import { ProductStatus } from '../../../../core/models/product.model';
import { CloudinaryUploadService } from '../../../../core/services/cloudinary-upload.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-ajouter-produit',
  templateUrl: './ajouter-produit.component.html',
  styleUrls: ['./ajouter-produit.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule]
})
export class AjouterProduitComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  produitForm: FormGroup;
  isCameraOpen = false;
  isStreaming = false;
  capturedPhoto: string | null = null;
  blurredPhoto: string | null = null;
  badgeCertifie = false;
  categories: Category[] = [];
  isSubmitting = false;
  photoUrl: string = '';
  previewUrl: string = '';
  isUploading = false;
  uploadError: string = '';
  private destroy$ = new Subject<void>();

  // Liste temporaire de catégories (à remplacer par un service de catégories)
  private availableCategories: string[] = [
    'Électronique',
    'Vêtements',
    'Alimentation',
    'Maison',
    'Sports',
    'Livres',
    'Beauté',
    'Jardinage',
    'Automobile',
    'Autres'
  ];

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private cloudinaryUploadService: CloudinaryUploadService,
    private router: Router
  ) {
    this.produitForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      prix: ['', [Validators.required, Validators.min(0)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      categorie: ['', Validators.required],
      status: [ProductStatus.PENDING]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategories(): void {
    // Simulation du chargement des catégories
    this.categories = this.availableCategories.map((cat, index) => ({
      id: (index + 1).toString(),
      name: cat,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  // Gestion de l'upload d'image
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadImage(file);
    }
  }

  private uploadImage(file: File): void {
    // Validation du fichier
    if (!this.cloudinaryUploadService.isValidImageFile(file)) {
      this.uploadError = 'Fichier image invalide ou trop volumineux (max 10MB)';
      this.showErrorMessage('Fichier image invalide. Veuillez sélectionner une image JPG, PNG, GIF ou WEBP de moins de 10MB.');
      return;
    }

    this.isUploading = true;
    this.uploadError = '';

    // Créer l'URL de prévisualisation
    this.previewUrl = URL.createObjectURL(file);

    this.cloudinaryUploadService.uploadImage(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.photoUrl = result.secure_url;
          this.isUploading = false;
          this.showSuccessMessage('Image uploadée avec succès !');
          console.log('Image uploadée avec succès:', result.secure_url);
        },
        error: (error) => {
          this.isUploading = false;
          this.uploadError = error.message || 'Erreur lors de l\'upload de l\'image';
          this.showErrorMessage('Erreur lors de l\'upload de l\'image. Veuillez réessayer.');
          console.error('Erreur lors de l\'upload:', error);
        }
      });
  }

  removeImage(): void {
    this.photoUrl = '';
    this.previewUrl = '';
    this.uploadError = '';
  }

  onSubmit(): void {
    if (this.produitForm.valid && this.photoUrl) {
      this.isSubmitting = true;

      const formValue = this.produitForm.value;

      const newProduct = {
        name: formValue.nom,
        description: formValue.description,
        price: formValue.prix,
        stock: formValue.stock,
        category: formValue.categorie,
        images: this.photoUrl ? [this.photoUrl] : [],
        sellerId: '2', // TODO: Get from auth service
        status: formValue.status || ProductStatus.PENDING
      };

      this.productService.addProduct(newProduct)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (product) => {
            console.log('Produit ajouté avec succès:', product);
            this.isSubmitting = false;
            this.showSuccessMessage('Produit ajouté avec succès ! Il sera visible après validation par l\'administrateur.');
            this.router.navigate(['/produits/mes-produits']);
          },
          error: (error) => {
            console.error('Erreur lors de l\'ajout du produit:', error);
            this.isSubmitting = false;
            this.showErrorMessage('Erreur lors de l\'ajout du produit. Veuillez réessayer.');
          }
        });
    } else {
      this.markFormGroupTouched();
      if (!this.photoUrl) {
        this.showErrorMessage('Veuillez sélectionner une photo du produit.');
      }
    }
  }

  private resetForm(): void {
    this.produitForm.reset();
    this.capturedPhoto = null;
    this.blurredPhoto = null;
    this.badgeCertifie = false;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.produitForm.controls).forEach(key => {
      const control = this.produitForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Vérifier si un champ est invalide
   * @param fieldName Le nom du champ à vérifier
   * @returns boolean True si le champ est invalide et touché
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.produitForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Obtenir le message d'erreur pour un champ
   * @param fieldName Le nom du champ
   * @returns string Le message d'erreur
   */
  getFieldError(fieldName: string): string {
    const field = this.produitForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} est requis`;
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} doit contenir au moins ${field.errors['minlength'].requiredLength} caractères`;
      if (field.errors['min']) return `${this.getFieldLabel(fieldName)} doit être positif`;
    }
    return '';
  }

  /**
   * Obtenir le label d'un champ pour les messages d'erreur
   * @param fieldName Le nom du champ
   * @returns string Le label du champ
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      nom: 'Le nom du produit',
      description: 'La description',
      prix: 'Le prix',
      stock: 'Le stock',
      categorie: 'La catégorie'
    };
    return labels[fieldName] || fieldName;
  }

  // Getters pour faciliter l'accès dans le template
  get nom() { return this.produitForm.get('nom'); }
  get description() { return this.produitForm.get('description'); }
  get prix() { return this.produitForm.get('prix'); }
  get stock() { return this.produitForm.get('stock'); }
  get categorie() { return this.produitForm.get('categorie'); }

  /**
   * Afficher un message de succès
   * @param message Le message à afficher
   */
  private showSuccessMessage(message: string): void {
    // Créer un élément de notification temporaire
    this.showNotification(message, 'success');
  }

  /**
   * Afficher un message d'erreur
   * @param message Le message à afficher
   */
  private showErrorMessage(message: string): void {
    // Créer un élément de notification temporaire
    this.showNotification(message, 'error');
  }

  /**
   * Afficher une notification temporaire
   * @param message Le message à afficher
   * @param type Le type de notification (success/error)
   */
  private showNotification(message: string, type: 'success' | 'error'): void {
    // Créer un élément de notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;

    // Ajouter les styles CSS
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#28a745' : '#dc3545'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 5px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 1000;
      animation: slideInRight 0.3s ease;
      max-width: 300px;
    `;

    // Ajouter au DOM
    document.body.appendChild(notification);

    // Fermer automatiquement après 5 secondes
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);

    // Fermer manuellement avec le bouton
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      });
    }
  }
}