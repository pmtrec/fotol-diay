import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { ImageUploadService } from '../../../core/services/image-upload.service';
import { Category } from '../../../core/models/category.model';
import { ProductStatus } from '../../../core/models/product.model';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // Ajouter les imports nécessaires selon votre configuration
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.scss'
})
export class AddProductComponent implements OnInit, OnDestroy {
  productForm: FormGroup;
  categories: Category[] = [];
  selectedImages: string[] = [];
  isSubmitting = false;
  private destroy$ = new Subject<void>();

  // Propriétés pour la caméra
  cameraStream: MediaStream | null = null;
  showCameraPreview = false;
  videoElement: HTMLVideoElement | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private authService: AuthService,
    private imageUploadService: ImageUploadService,
    private router: Router
  ) {
    this.productForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: ['', [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      stock: ['', [Validators.required, Validators.min(0)]],
      images: this.fb.array([]),
      status: [ProductStatus.PENDING]
    });
  }

  private loadCategories(): void {
    this.productService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe(categories => {
        this.categories = categories;
      });
  }

  get imagesFormArray(): FormArray {
    return this.productForm.get('images') as FormArray;
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file && this.selectedImages.length < 3) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        this.selectedImages.push(imageUrl);
        this.imagesFormArray.push(this.fb.control(imageUrl));
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
    this.imagesFormArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.productForm.valid && this.selectedImages.length > 0) {
      this.isSubmitting = true;

      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        alert('Utilisateur non connecté');
        return;
      }

      const formValue = this.productForm.value;
      const newProduct = {
        name: formValue.name,
        description: formValue.description,
        price: formValue.price,
        category: formValue.category,
        stock: formValue.stock,
        sellerId: currentUser.id,
        images: this.selectedImages
      };

      this.productService.addProduct(newProduct)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (product) => {
            alert('Produit ajouté avec succès ! Il sera visible après validation par l\'administrateur.');
            this.router.navigate(['/vendeur/products']);
          },
          error: (error) => {
            console.error('Erreur lors de l\'ajout du produit:', error);
            alert('Erreur lors de l\'ajout du produit. Veuillez réessayer.');
            this.isSubmitting = false;
          }
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  navigateBack(): void {
    this.router.navigate(['/vendeur/products']);
  }

  getFieldError(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return `${fieldName} est requis`;
      if (field.errors['minlength']) return `${fieldName} doit contenir au moins ${field.errors['minlength'].requiredLength} caractères`;
      if (field.errors['min']) return `${fieldName} doit être positif`;
    }
    return '';
  }

  /**
   * Ouvrir la caméra avec prévisualisation
   */
  async openCamera(): Promise<void> {
    if (this.selectedImages.length >= 3) {
      alert('Vous ne pouvez ajouter que 3 images maximum');
      return;
    }

    try {
      this.cameraStream = await this.imageUploadService.openCamera();
      this.showCameraPreview = true;

      // Attendre le prochain cycle de détection de changement pour accéder à l'élément vidéo
      setTimeout(() => {
        this.initializeVideoElement();
      }, 0);
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de la caméra:', error);
      alert(`Erreur: ${error}`);
    }
  }

  /**
   * Initialiser l'élément vidéo avec le flux caméra
   */
  private initializeVideoElement(): void {
    this.videoElement = document.getElementById('cameraVideo') as HTMLVideoElement;
    if (this.videoElement && this.cameraStream) {
      this.videoElement.srcObject = this.cameraStream;
      this.videoElement.play();
    }
  }

  /**
   * Capturer l'image depuis la prévisualisation caméra
   */
  async captureImage(): Promise<void> {
    if (!this.videoElement) {
      alert('Erreur: élément vidéo non trouvé');
      return;
    }

    try {
      const currentUser = this.authService.getCurrentUser();
      const imageUrl = await this.imageUploadService.captureFromVideoElement(this.videoElement, currentUser?.id);

      this.selectedImages.push(imageUrl);
      this.imagesFormArray.push(this.fb.control(imageUrl));

      this.closeCamera();
    } catch (error) {
      console.error('Erreur lors de la capture:', error);
      alert(`Erreur lors de la capture: ${error}`);
    }
  }

  /**
   * Fermer la caméra
   */
  closeCamera(): void {
    if (this.cameraStream) {
      this.imageUploadService.stopVideoStream(this.cameraStream);
      this.cameraStream = null;
    }
    this.showCameraPreview = false;
    this.videoElement = null;
  }

  /**
   * Vérifier si la caméra est disponible
   */
  isCameraAvailable(): boolean {
    return this.imageUploadService.isCameraAvailable();
  }
}