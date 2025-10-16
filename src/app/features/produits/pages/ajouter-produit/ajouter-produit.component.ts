import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ProductService, Produit } from '../../../../core/services/product.service';
import { Category } from '../../../../core/models/category.model';
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
      categorie: ['', Validators.required]
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
      id: index + 1,
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
          console.log('Image uploadée avec succès:', result.secure_url);
        },
        error: (error) => {
          this.isUploading = false;
          this.uploadError = error.message || 'Erreur lors de l\'upload de l\'image';
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
      // Set loading state to true
      this.isSubmitting = true;

      const formValue = this.produitForm.value;

      const newProduct = {
        name: formValue.nom,
        description: formValue.description,
        price: formValue.prix,
        stock: formValue.stock,
        category: formValue.categorie,
        images: this.photoUrl ? [this.photoUrl] : [],
        sellerId: 2 // TODO: Get from auth service
      };

      this.productService.addProduct(newProduct)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (product) => {
            console.log('Produit ajouté avec succès:', product);
            // Reset loading state
            this.isSubmitting = false;
            // Redirect to products list
            this.router.navigate(['/produits/mes-produits']);
          },
          error: (error) => {
            console.error('Erreur lors de l\'ajout du produit:', error);
            // Reset loading state on error
            this.isSubmitting = false;
            alert('Erreur lors de l\'ajout du produit. Veuillez réessayer.');
          }
        });
    } else {
      this.markFormGroupTouched();
      if (!this.photoUrl) {
        alert('Veuillez sélectionner une photo du produit.');
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

  // Getters pour faciliter l'accès dans le template
  get nom() { return this.produitForm.get('nom'); }
  get description() { return this.produitForm.get('description'); }
  get prix() { return this.produitForm.get('prix'); }
  get stock() { return this.produitForm.get('stock'); }
  get categorie() { return this.produitForm.get('categorie'); }
}