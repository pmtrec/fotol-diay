import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.scss']
})
export class AdminSettingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Category management
  categories: Category[] = [];
  categoryForm: FormGroup;
  editingCategory: Category | null = null;
  showCategoryForm = false;

  // System settings
  systemForm: FormGroup;

  // UI state
  activeTab = 'categories';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService
  ) {
    this.categoryForm = this.createCategoryForm();
    this.systemForm = this.createSystemForm();
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createCategoryForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      isActive: [true]
    });
  }

  private createSystemForm(): FormGroup {
    return this.fb.group({
      siteName: ['Klick Market', Validators.required],
      siteDescription: ['Plateforme de vente en ligne', Validators.required],
      contactEmail: ['contact@klick.com', [Validators.required, Validators.email]],
      maxProductsPerSeller: [100, [Validators.required, Validators.min(1)]],
      allowSelfValidation: [false],
      maintenanceMode: [false]
    });
  }

  // Tab management
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Category management methods
  private loadCategories(): void {
    this.isLoading = true;
    this.productService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des catégories:', error);
          this.isLoading = false;
        }
      });
  }

  refreshCategories(): void {
    this.loadCategories();
  }

  showAddCategoryForm(): void {
    this.editingCategory = null;
    this.categoryForm.reset({ isActive: true });
    this.showCategoryForm = true;
  }

  editCategory(category: Category): void {
    this.editingCategory = category;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description,
      isActive: category.isActive
    });
    this.showCategoryForm = true;
  }

  cancelCategoryEdit(): void {
    this.showCategoryForm = false;
    this.editingCategory = null;
    this.categoryForm.reset();
  }

  private resetCategoryForm(): void {
    this.showCategoryForm = false;
    this.editingCategory = null;
    this.categoryForm.reset();
    this.isLoading = false;
  }

  saveCategory(): void {
    if (this.categoryForm.valid) {
      this.isLoading = true;

      if (this.editingCategory) {
        // Update existing category via API
        this.productService.updateCategory(this.editingCategory.id, this.categoryForm.value)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updatedCategory) => {
              // Update local categories array
              const index = this.categories.findIndex(c => c.id === this.editingCategory!.id);
              if (index !== -1) {
                this.categories[index] = updatedCategory;
              }
              this.resetCategoryForm();
            },
            error: (error) => {
              console.error('Erreur lors de la mise à jour de la catégorie:', error);
              alert('Erreur lors de la mise à jour de la catégorie. Veuillez réessayer.');
              this.isLoading = false;
            }
          });
      } else {
        // Create new category via API
        this.productService.createCategory(this.categoryForm.value)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (newCategory) => {
              // Add to local categories array
              this.categories.push(newCategory);
              this.resetCategoryForm();
            },
            error: (error) => {
              console.error('Erreur lors de la création de la catégorie:', error);
              alert('Erreur lors de la création de la catégorie. Veuillez réessayer.');
              this.isLoading = false;
            }
          });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  deleteCategory(category: Category): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`)) {
      this.isLoading = true;
      this.productService.deleteCategory(category.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Remove from local categories array
            this.categories = this.categories.filter(c => c.id !== category.id);
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Erreur lors de la suppression de la catégorie:', error);
            alert('Erreur lors de la suppression de la catégorie. Veuillez réessayer.');
            this.isLoading = false;
          }
        });
    }
  }

  toggleCategoryStatus(category: Category): void {
    const newStatus = !category.isActive;
    this.productService.updateCategory(category.id, { isActive: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedCategory) => {
          // Update local category
          category.isActive = updatedCategory.isActive;
          category.updatedAt = updatedCategory.updatedAt;
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour du statut de la catégorie:', error);
          alert('Erreur lors de la mise à jour du statut. Veuillez réessayer.');
        }
      });
  }

  // System settings methods
  saveSystemSettings(): void {
    if (this.systemForm.valid) {
      // Here you would typically save to backend
      alert('Paramètres système sauvegardés avec succès!');
      console.log('System settings:', this.systemForm.value);
    } else {
      this.markFormGroupTouched();
    }
  }

  // Utility methods
  private markFormGroupTouched(): void {
    Object.keys(this.categoryForm.controls).forEach(key => {
      this.categoryForm.get(key)?.markAsTouched();
    });
    Object.keys(this.systemForm.controls).forEach(key => {
      this.systemForm.get(key)?.markAsTouched();
    });
  }

  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return `${fieldName} est requis`;
      if (field.errors['minlength']) return `${fieldName} doit contenir au moins ${field.errors['minlength'].requiredLength} caractères`;
      if (field.errors['email']) return 'Email invalide';
      if (field.errors['min']) return 'La valeur doit être positive';
    }
    return '';
  }
}