import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Category } from '../../../../core/models/category.model';
import { ProductService } from '../../../../core/services/product.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  selectedCategories: string[] = [];
  isLoading = false;
  private destroy$ = new Subject<void>();

  @Output() categorySelected = new EventEmitter<string[]>();

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategories(): void {
    this.isLoading = true;
    this.productService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories.filter(cat => cat.isActive);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des catégories:', error);
          this.isLoading = false;
        }
      });
  }

  toggleCategory(categoryName: string): void {
    const index = this.selectedCategories.indexOf(categoryName);
    if (index > -1) {
      this.selectedCategories = this.selectedCategories.filter(cat => cat !== categoryName);
    } else {
      this.selectedCategories = [...this.selectedCategories, categoryName];
    }
    // Emit event to parent component to filter products
    this.categorySelected.emit(this.selectedCategories);
    console.log('Catégories sélectionnées:', this.selectedCategories);
  }

  isCategorySelected(categoryName: string): boolean {
    return this.selectedCategories.includes(categoryName);
  }

  clearFilter(): void {
    this.selectedCategories = [];
    this.categorySelected.emit(this.selectedCategories);
    console.log('Filtre effacé');
  }
}
