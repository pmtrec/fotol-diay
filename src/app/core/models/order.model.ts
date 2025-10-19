export interface Order {
  id: number;
  orderNumber: string; // Numéro de commande unique
  customerId: string;
  customerInfo: CustomerInfo;
  items: OrderItem[];
  status: OrderStatus;
  payment: PaymentInfo;
  shipping: ShippingInfo;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  currency: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  // Tracking
  viewedByCustomer?: boolean;
  viewedBySeller?: boolean;
}

export interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  productImage: string;
  sellerId: string;
  sellerName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: OrderItemStatus;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp?: string;
}

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: Date;
  amount: number;
  currency: string;
}

export interface ShippingInfo {
  address: Address;
  method: ShippingMethod;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  cost: number;
}

export interface Address {
  street: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export enum OrderStatus {
  PENDING = 'pending',           // Commande créée, en attente de paiement
  PAID = 'paid',                // Paiement confirmé
  PROCESSING = 'processing',     // En cours de traitement
  SHIPPED = 'shipped',          // Expédiée
  DELIVERED = 'delivered',      // Livrée
  CANCELLED = 'cancelled',      // Annulée
  REFUNDED = 'refunded'         // Remboursée
}

export enum OrderItemStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  CARD = 'card',
  PAYPAL = 'paypal',
  MOBILE_MONEY = 'mobile_money',
  BANK_TRANSFER = 'bank_transfer',
  CASH_ON_DELIVERY = 'cash_on_delivery'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum ShippingMethod {
  STANDARD = 'standard',
  EXPRESS = 'express',
  PICKUP = 'pickup',
  SELLER_DELIVERY = 'seller_delivery'
}

// Interfaces pour la création de commandes
export interface CreateOrderRequest {
  customerInfo: CustomerInfo;
  items: CartItemOrder[];
  shipping: ShippingInfo;
  payment: Omit<PaymentInfo, 'status' | 'transactionId' | 'paidAt'>;
  notes?: string;
}

export interface CartItemOrder {
  productId: string;
  quantity: number;
}

// Interfaces pour les filtres et recherche
export interface OrderFilters {
  status?: OrderStatus[];
  customerId?: string;
  sellerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: { [key in OrderStatus]: number };
  ordersByMonth: { month: string; count: number; revenue: number }[];
  topSellingProducts: { productId: string; productName: string; quantity: number; revenue: number }[];
}