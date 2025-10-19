export interface Payment {
  id: string;
  orderId: number;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  gateway: PaymentGateway;
  transactionId?: string;
  externalTransactionId?: string; // ID de la transaction chez le provider externe
  metadata?: PaymentMetadata;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  refund?: PaymentRefund;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  orderId: number;
  customerEmail: string;
  description: string;
  metadata?: PaymentMetadata;
  expiresAt: Date;
}

export interface PaymentMetadata {
  customerId?: number;
  customerName?: string;
  customerEmail?: string;
  orderNumber?: string;
  productNames?: string[];
  sellerId?: number;
  sellerName?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PaymentRefund {
  id: string;
  amount: number;
  reason: RefundReason;
  status: RefundStatus;
  processedAt?: Date;
  transactionId?: string;
  metadata?: any;
}

export enum PaymentMethod {
  CARD = 'card',
  MOBILE_MONEY = 'mobile_money',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  CASH_ON_DELIVERY = 'cash_on_delivery',
  ORANGE_MONEY = 'orange_money',
  MTN_MONEY = 'mtn_money',
  WAVE = 'wave'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  CANCELED = 'canceled',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export enum PaymentGateway {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  FLUTTERWAVE = 'flutterwave',
  PAYDUNYA = 'paydunya',
  ORANGE_MONEY = 'orange_money',
  MTN_MOMO = 'mtn_momo',
  WAVE = 'wave'
}

export enum RefundReason {
  DUPLICATE = 'duplicate',
  FRAUDULENT = 'fraudulent',
  REQUESTED_BY_CUSTOMER = 'requested_by_customer',
  PRODUCT_NOT_RECEIVED = 'product_not_received',
  PRODUCT_NOT_AS_DESCRIBED = 'product_not_as_described',
  OTHER = 'other'
}

export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled'
}

// Interfaces pour les requêtes de paiement
export interface CreatePaymentRequest {
  orderId: number;
  amount: number;
  currency: string;
  method: PaymentMethod;
  customerInfo: PaymentCustomerInfo;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: PaymentMetadata;
}

export interface PaymentCustomerInfo {
  name: string;
  email: string;
  phone?: string;
  address?: Address;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface ProcessPaymentRequest {
  paymentIntentId: string;
  paymentMethodId?: string;
  returnUrl?: string;
}

export interface RefundPaymentRequest {
  paymentId: string;
  amount?: number; // Si pas spécifié, remboursement total
  reason: RefundReason;
  metadata?: any;
}

// Interfaces pour les webhooks
export interface PaymentWebhookEvent {
  id: string;
  type: PaymentWebhookEventType;
  data: any;
  created: Date;
  processed?: boolean;
  processedAt?: Date;
}

export enum PaymentWebhookEventType {
  PAYMENT_SUCCEEDED = 'payment_succeeded',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_CANCELED = 'payment_canceled',
  REFUND_SUCCEEDED = 'refund_succeeded',
  REFUND_FAILED = 'refund_failed',
  DISPUTE_CREATED = 'dispute_created',
  DISPUTE_UPDATED = 'dispute_updated'
}

// Interfaces pour les statistiques de paiement
export interface PaymentStats {
  totalPayments: number;
  totalRevenue: number;
  successfulPayments: number;
  failedPayments: number;
  successRate: number;
  averagePaymentAmount: number;
  paymentsByMethod: { [key in PaymentMethod]: number };
  paymentsByStatus: { [key in PaymentStatus]: number };
  dailyRevenue: { date: string; amount: number }[];
  monthlyRevenue: { month: string; amount: number }[];
}

// Configuration des gateways de paiement
export interface PaymentGatewayConfig {
  gateway: PaymentGateway;
  enabled: boolean;
  publicKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  supportedCurrencies: string[];
  supportedMethods: PaymentMethod[];
  fees: PaymentFees;
}

export interface PaymentFees {
  percentage: number;
  fixed: number;
  minAmount: number;
  maxAmount: number;
}

// Interfaces pour les erreurs de paiement
export interface PaymentError {
  code: PaymentErrorCode;
  message: string;
  type: PaymentErrorType;
  declineCode?: string;
  param?: string;
}

export enum PaymentErrorCode {
  CARD_DECLINED = 'card_declined',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  EXPIRED_CARD = 'expired_card',
  INCORRECT_CVC = 'incorrect_cvc',
  PROCESSING_ERROR = 'processing_error',
  RATE_LIMIT = 'rate_limit',
  AUTHENTICATION_FAILED = 'authentication_failed',
  INVALID_REQUEST = 'invalid_request',
  API_ERROR = 'api_error',
  NETWORK_ERROR = 'network_error'
}

export enum PaymentErrorType {
  CARD_ERROR = 'card_error',
  INVALID_REQUEST_ERROR = 'invalid_request_error',
  API_ERROR = 'api_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  RATE_LIMIT_ERROR = 'rate_limit_error'
}

// Interface pour les méthodes de paiement sauvegardées
export interface SavedPaymentMethod {
  id: string;
  customerId: number;
  type: PaymentMethod;
  gateway: PaymentGateway;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: Date;
}