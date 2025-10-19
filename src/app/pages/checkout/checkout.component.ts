import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { CartItem } from '../../core/models/cart.model';
import { CreateOrderRequest, CustomerInfo, ShippingInfo, PaymentInfo, PaymentMethod, PaymentStatus, Address } from '../../core/models/order.model';
import { NotificationType, NotificationPriority, NotificationCategory } from '../../core/models/notification.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Forms
  customerForm!: FormGroup;
  shippingForm!: FormGroup;
  paymentForm!: FormGroup;

  // Data
  cartItems: CartItem[] = [];
  loading = false;
  submitting = false;

  // Current step
  currentStep = 1;
  totalSteps = 3;

  // Calculations
  subtotal = 0;
  tax = 0;
  shippingCost = 0;
  total = 0;

  // Payment methods
  paymentMethods = [
    { value: PaymentMethod.CARD, label: 'Carte bancaire', icon: 'fa-solid fa-credit-card' },
    { value: PaymentMethod.PAYPAL, label: 'PayPal', icon: 'fa-solid fa-paypal' },
    { value: PaymentMethod.MOBILE_MONEY, label: 'Mobile Money', icon: 'fa-solid fa-mobile-alt' },
    { value: PaymentMethod.BANK_TRANSFER, label: 'Virement bancaire', icon: 'fa-solid fa-university' },
    { value: PaymentMethod.CASH_ON_DELIVERY, label: 'Paiement à la livraison', icon: 'fa-solid fa-truck' }
  ];

  // Shipping methods
  shippingMethods = [
    { value: 'standard', label: 'Livraison standard (3-5 jours)', cost: 2500, estimated: '3-5 jours' },
    { value: 'express', label: 'Livraison express (1-2 jours)', cost: 5000, estimated: '1-2 jours' },
    { value: 'pickup', label: 'Retrait en point relais', cost: 0, estimated: '2-3 jours' }
  ];

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadCartItems();
    this.calculateTotals();
    this.loadUserProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    // Customer information form
    this.customerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{8,}$/)]],
      whatsapp: ['']
    });

    // Shipping information form
    this.shippingForm = this.fb.group({
      address: this.fb.group({
        street: ['', [Validators.required]],
        city: ['', [Validators.required]],
        region: ['', [Validators.required]],
        postalCode: ['', [Validators.required]],
        country: ['Senegal', [Validators.required]]
      }),
      method: ['standard', [Validators.required]],
      notes: ['']
    });

    // Payment information form
    this.paymentForm = this.fb.group({
      method: [PaymentMethod.CARD, [Validators.required]],
      cardNumber: [''],
      expiryDate: [''],
      cvv: [''],
      cardHolderName: ['']
    });

    // Watch shipping method changes
    this.shippingForm.get('method')?.valueChanges.subscribe(() => {
      this.updateShippingCost();
      this.calculateTotals();
    });
  }

  private loadCartItems(): void {
    this.cartService.getCart().subscribe({
      next: (cart) => {
        this.cartItems = cart.items;
        this.calculateTotals();
      },
      error: (error) => {
        console.error('Error loading cart:', error);
      }
    });
  }

  private loadUserProfile(): void {
    this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.customerForm.patchValue({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || '',
            whatsapp: user.whatsapp || ''
          });
        }
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
      }
    });
  }

  private calculateTotals(): void {
    this.subtotal = this.cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    this.tax = this.subtotal * 0.18; // 18% TVA
    this.updateShippingCost();
    this.total = this.subtotal + this.tax + this.shippingCost;
  }

  private updateShippingCost(): void {
    const shippingMethod = this.shippingForm.get('method')?.value;
    const method = this.shippingMethods.find(m => m.value === shippingMethod);
    this.shippingCost = method ? method.cost : 0;
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  canProceedToNextStep(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.customerForm.valid;
      case 2:
        return this.shippingForm.valid;
      case 3:
        return this.paymentForm.valid && this.cartItems.length > 0;
      default:
        return false;
    }
  }

  onSubmit(): void {
    if (this.canProceedToNextStep() && this.currentStep === this.totalSteps) {
      this.submitting = true;

      const customerInfo: CustomerInfo = this.customerForm.value;

      const shippingInfo: ShippingInfo = {
        address: this.shippingForm.value.address,
        method: this.shippingForm.value.method as any,
        cost: this.shippingCost,
        estimatedDelivery: this.getEstimatedDeliveryDate()
      };

      const paymentInfo: PaymentInfo = {
        method: this.paymentForm.value.method,
        status: PaymentStatus.PENDING,
        amount: this.total,
        currency: 'XOF'
      };

      const orderRequest: CreateOrderRequest = {
        customerInfo,
        items: this.cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        })),
        shipping: shippingInfo,
        payment: paymentInfo,
        notes: this.shippingForm.value.notes || undefined
      };

      // Validate order
      const validation = this.orderService.validateOrder(orderRequest);
      if (!validation.valid) {
        this.notificationService.createNotification({
          userId: '1', // TODO: Get current user ID
          type: NotificationType.ORDER_CANCELLED,
          title: 'Erreur de validation',
          message: 'Erreur de validation:\n' + validation.errors.join('\n'),
          read: false,
          priority: NotificationPriority.NORMAL,
          category: NotificationCategory.ORDERS
        }).subscribe();
        this.submitting = false;
        return;
      }

      this.orderService.createOrderFromCart(
        this.cartItems,
        customerInfo,
        shippingInfo,
        paymentInfo
      ).subscribe({
        next: (order) => {
          // Clear cart
          this.cartService.clearCart();

          // Navigate to success page or order details
          this.router.navigate(['/orders', order.id], {
            queryParams: { success: 'true' }
          });
        },
        error: (error) => {
          console.error('Error creating order:', error);
          this.notificationService.createNotification({
            userId: '1', // TODO: Get current user ID
            type: NotificationType.ORDER_CANCELLED,
            title: 'Erreur de commande',
            message: 'Erreur lors de la création de la commande. Veuillez réessayer.',
            read: false,
            priority: NotificationPriority.NORMAL,
            category: NotificationCategory.ORDERS
          }).subscribe();
          this.submitting = false;
        }
      });
    }
  }

  private getEstimatedDeliveryDate(): Date {
    const method = this.shippingForm.get('method')?.value;
    const days = method === 'express' ? 2 : method === 'standard' ? 5 : 3;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  }

  getSelectedShippingMethod(): any {
    const method = this.shippingForm.get('method')?.value;
    return this.shippingMethods.find(m => m.value === method);
  }

  getSelectedPaymentMethod(): any {
    const method = this.paymentForm.get('method')?.value;
    return this.paymentMethods.find(m => m.value === method);
  }

  // Navigation helpers
  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  continueShopping(): void {
    this.router.navigate(['/']);
  }
}