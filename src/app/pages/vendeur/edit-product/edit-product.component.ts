import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ProductService, Produit } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { ImageUploadService } from '../../../core/services/image-upload.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Category } from '../../../core/models/category.model';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-product.component.html',
  styleUrl: './edit-product.component.scss'
})
export class EditProductComponent implements OnInit, OnDestroy {
  productForm: FormGroup;
  categories: Category[] = [];
  selectedImages: string[] = [];
  isSubmitting = false;
  isLoading = true;
  productId: string | null = null;
  originalProduct: Produit | null = null;
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
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.productForm = this.createForm();
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.loadProduct();
    } else {
      this.router.navigate(['/error']);
    }
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeCamera();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: ['', [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      stock: ['', [Validators.required, Validators.min(0)]],
      images: this.fb.array([]),
      status: ['pending']
    });
  }

  private loadCategories(): void {
    this.productService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe(categories => {
        this.categories = categories;
      });
  }

  private loadProduct(): void {
    if (!this.productId) return;

    this.productService.getProductById(this.productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product) => {
          this.originalProduct = product;
          this.populateForm(product);
          this.selectedImages = [...product.images];
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement du produit:', error);
          this.router.navigate(['/error']);
        }
      });
  }

  private populateForm(product: Produit): void {
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      status: product.status
    });

    // Populate images array
    const imagesArray = this.productForm.get('images') as FormArray;
    imagesArray.clear();
    product.images.forEach(image => {
      imagesArray.push(this.fb.control(image));
    });
  }

  get imagesFormArray(): FormArray {
    return this.productForm.get('images') as FormArray;
  }

  onImageSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      const filesToProcess = Array.from(files).slice(0, 3 - this.selectedImages.length);

      filesToProcess.forEach((file: any) => {
        if (file && this.selectedImages.length < 3) {
          const currentUser = this.authService.getCurrentUser();

          this.imageUploadService.uploadImage(file, currentUser?.id || '').subscribe({
            next: (imageUrl) => {
              this.selectedImages.push(imageUrl);
              this.imagesFormArray.push(this.fb.control(imageUrl));
            },
            error: (error) => {
              console.error('Erreur lors de l\'upload de l\'image:', error);
              this.notificationService.showNotification(
                `Erreur lors de l'upload: ${error.message || error}`,
                'error'
              );
            }
          });
        }
      });

      // Clear the input value to allow selecting the same file again
      event.target.value = '';
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
        this.notificationService.showNotification('Utilisateur non connecté', 'error');
        return;
      }

      // Check permissions
      if (currentUser.role === UserRole.SELLER && this.originalProduct?.sellerId !== currentUser.id) {
        this.notificationService.showNotification('Vous ne pouvez modifier que vos propres produits', 'warning');
        this.isSubmitting = false;
        return;
      }

      const formValue = this.productForm.value;
      const updateData: Partial<Produit> = {
        name: formValue.name,
        description: formValue.description,
        price: formValue.price,
        category: formValue.category,
        stock: formValue.stock,
        images: this.selectedImages,
        status: formValue.status
      };

      if (this.productId) {
        this.productService.updateProduct(this.productId, updateData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (product) => {
              this.notificationService.showNotification('Produit modifié avec succès !', 'success');
              this.router.navigate(['/vendeur/mes-produits']);
            },
            error: (error) => {
              console.error('Erreur lors de la modification du produit:', error);
              this.notificationService.showNotification(
                'Erreur lors de la modification du produit. Veuillez réessayer.',
                'error'
              );
              this.isSubmitting = false;
            }
          });
      }
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
    // Navigate back to the appropriate dashboard based on user role
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.role === UserRole.ADMIN) {
      this.router.navigate(['/admin/validation-produits']);
    } else {
      this.router.navigate(['/vendeur/mes-produits']);
    }
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

  // Camera methods
  async openCamera(): Promise<void> {
    if (this.selectedImages.length >= 3) {
      this.notificationService.showNotification('Vous ne pouvez ajouter que 3 images maximum', 'warning');
      return;
    }

    try {
      this.cameraStream = await this.imageUploadService.openCamera();
      this.showCameraPreview = true;

      setTimeout(() => {
        this.initializeVideoElement();
      }, 0);
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de la caméra:', error);
      this.notificationService.showNotification(`Erreur: ${error}`, 'error');
    }
  }

  private initializeVideoElement(): void {
    this.videoElement = document.getElementById('cameraVideo') as HTMLVideoElement;
    if (this.videoElement && this.cameraStream) {
      this.videoElement.srcObject = this.cameraStream;
      this.videoElement.play();
    }
  }

  async captureImage(): Promise<void> {
    if (!this.videoElement) {
      this.notificationService.showNotification('Erreur: élément vidéo non trouvé', 'error');
      return;
    }

    try {
      const currentUser = this.authService.getCurrentUser();
      const imageUrl = await this.imageUploadService.captureFromVideoElement(this.videoElement, currentUser?.id || '');

      this.selectedImages.push(imageUrl);
      this.imagesFormArray.push(this.fb.control(imageUrl));

      this.closeCamera();
    } catch (error) {
      console.error('Erreur lors de la capture:', error);
      this.notificationService.showNotification(`Erreur lors de la capture: ${error}`, 'error');
    }
  }

  closeCamera(): void {
    if (this.cameraStream) {
      this.imageUploadService.stopVideoStream(this.cameraStream);
      this.cameraStream = null;
    }
    this.showCameraPreview = false;
    this.videoElement = null;
  }

  isCameraAvailable(): boolean {
    return this.imageUploadService.isCameraAvailable();
  }

  // Check if user can edit this product
  canEditProduct(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !this.originalProduct) return false;

    // Admins can edit all products
    if (currentUser.role === UserRole.ADMIN) return true;

    // Sellers can only edit their own products
    if (currentUser.role === UserRole.SELLER) {
      return this.originalProduct.sellerId === currentUser.id;
    }

    return false;
  }
}