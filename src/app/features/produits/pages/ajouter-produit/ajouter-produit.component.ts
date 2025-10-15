import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { Category } from '../../../../core/models/category.model';
import { Product } from '../../../../core/models/product.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-ajouter-produit',
  templateUrl: './ajouter-produit.component.html',
  styleUrls: ['./ajouter-produit.component.scss'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class AjouterProduitComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement', { static: false }) canvasElement!: ElementRef<HTMLCanvasElement>;

  produitForm: FormGroup;
  isCameraOpen = false;
  isStreaming = false;
  capturedPhoto: string | null = null;
  blurredPhoto: string | null = null;
  badgeCertifie = false;
  categories: Category[] = [];
  isSubmitting = false;
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
    this.loadPhotosFromStorage();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopCamera();
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

  // Gestion de la caméra
  async startCamera(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });

      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = stream;
        this.isCameraOpen = true;
        this.isStreaming = true;
      }
    } catch (error) {
      console.error('Erreur lors de l\'accès à la caméra:', error);
      alert('Impossible d\'accéder à la caméra. Veuillez vérifier les permissions.');
    }
  }

  stopCamera(): void {
    if (this.videoElement?.nativeElement?.srcObject) {
      const stream = this.videoElement.nativeElement.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      this.videoElement.nativeElement.srcObject = null;
    }
    this.isCameraOpen = false;
    this.isStreaming = false;
  }

  capturePhoto(): void {
    if (!this.videoElement || !this.canvasElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      this.capturedPhoto = canvas.toDataURL('image/jpeg', 0.8);
      this.generateBlurredPhoto();
      this.badgeCertifie = true;
      this.savePhotosToStorage();
      this.stopCamera();
    }
  }

  private generateBlurredPhoto(): void {
    if (!this.capturedPhoto || !this.canvasElement) return;

    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (context) {
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Appliquer un flou à l'image
        context.filter = 'blur(4px)';
        context.drawImage(img, 0, 0);

        this.blurredPhoto = canvas.toDataURL('image/jpeg', 0.6);
        this.savePhotosToStorage();
      };
      img.src = this.capturedPhoto;
    }
  }

  private savePhotosToStorage(): void {
    if (this.capturedPhoto || this.blurredPhoto) {
      const photoData = {
        original: this.capturedPhoto,
        blurred: this.blurredPhoto,
        timestamp: new Date().toISOString(),
        badgeCertifie: this.badgeCertifie
      };

      try {
        localStorage.setItem('product_photos', JSON.stringify(photoData));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde dans localStorage:', error);
      }
    }
  }

  private loadPhotosFromStorage(): void {
    try {
      const savedData = localStorage.getItem('product_photos');
      if (savedData) {
        const photoData = JSON.parse(savedData);
        this.capturedPhoto = photoData.original || null;
        this.blurredPhoto = photoData.blurred || null;
        this.badgeCertifie = photoData.badgeCertifie || false;
      }
    } catch (error) {
      console.error('Erreur lors du chargement depuis localStorage:', error);
    }
  }

  onSubmit(): void {
    if (this.produitForm.valid && this.capturedPhoto) {
      // Set loading state to true
      this.isSubmitting = true;

      const formValue = this.produitForm.value;

      const newProduct: Product = {
        id: Date.now(),
        name: formValue.nom,
        description: formValue.description,
        price: formValue.prix,
        stock: formValue.stock,
        category: formValue.categorie,
        images: this.capturedPhoto ? [this.capturedPhoto] : [],
        status: 'pending' as any,
        sellerId: 1, // TODO: Get from auth service
        createdAt: new Date(),
        updatedAt: new Date()
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
      if (!this.capturedPhoto) {
        alert('Veuillez capturer une photo du produit.');
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