import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/components/client/navbar/navbar.component';
import { SidebarComponent } from '../../shared/components/client/sidebar/sidebar.component';
import { FooterComponent } from '../../shared/components/client/footer/footer.component';
import { ProduitsComponent } from '../../shared/components/client/produits/produit.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent, FooterComponent,ProduitsComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  selectedCategories: string[] = [];

  onCategorySelected(categories: string[]): void {
    this.selectedCategories = categories;
  }
}