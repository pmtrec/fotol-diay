import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PubliciteComponent } from '../bandePublicite/publicite.component';
import { CartService } from '../../../core/services/cart.service';
import { Cart } from '../../../core/models/cart.model';
import { Router } from '@angular/router'; 
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, PubliciteComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  cartItemCount = 0;
  private destroy$ = new Subject<void>();

  constructor(private cartService: CartService ,private router :Router) {}

  ngOnInit(): void {
    this.cartService.getCart()
      .pipe(takeUntil(this.destroy$))
      .subscribe((cart: Cart) => {
        this.cartItemCount = cart.itemCount;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  goToLogin(): void {
    this.router.navigate(['/auth']); // 🔹 navigation correcte
  }
}
