export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  read: boolean;
  readAt?: Date;
  priority: NotificationPriority;
  category: NotificationCategory;
  expiresAt?: Date;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationData {
  // Données spécifiques selon le type de notification
  orderId?: string;
  productId?: string;
  reviewId?: string;
  paymentId?: string;
  sellerId?: string;
  customerId?: string;
  amount?: number;
  productName?: string;
  orderNumber?: string;
  metadata?: { [key: string]: any };
}

export enum NotificationType {
  // Commandes
  ORDER_CREATED = 'order_created',
  ORDER_UPDATED = 'order_updated',
  ORDER_CANCELLED = 'order_cancelled',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',

  // Paiements
  PAYMENT_SUCCEEDED = 'payment_succeeded',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_REFUNDED = 'payment_refunded',

  // Produits
  PRODUCT_APPROVED = 'product_approved',
  PRODUCT_REJECTED = 'product_rejected',
  PRODUCT_LOW_STOCK = 'product_low_stock',
  PRODUCT_OUT_OF_STOCK = 'product_out_of_stock',

  // Reviews
  NEW_REVIEW = 'new_review',
  REVIEW_APPROVED = 'review_approved',
  REVIEW_REJECTED = 'review_rejected',

  // Système
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SYSTEM_UPDATE = 'system_update',
  SECURITY_ALERT = 'security_alert',

  // Vendeur
  SELLER_NEW_ORDER = 'seller_new_order',
  SELLER_PRODUCT_SOLD = 'seller_product_sold',
  SELLER_REVIEW_RECEIVED = 'seller_review_received',

  // Client
  CUSTOMER_ORDER_UPDATE = 'customer_order_update',
  CUSTOMER_PROMOTION = 'customer_promotion',
  CUSTOMER_WISHLIST_PRICE_DROP = 'customer_wishlist_price_drop'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationCategory {
  ORDERS = 'orders',
  PAYMENTS = 'payments',
  PRODUCTS = 'products',
  REVIEWS = 'reviews',
  SYSTEM = 'system',
  PROMOTIONS = 'promotions'
}

// Interfaces pour les filtres et recherche
export interface NotificationFilters {
  userId?: number;
  type?: NotificationType[];
  category?: NotificationCategory[];
  priority?: NotificationPriority[];
  read?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// Interface pour les statistiques de notifications
export interface NotificationStats {
  total: number;
  unread: number;
  byType: { [key in NotificationType]: number };
  byCategory: { [key in NotificationCategory]: number };
  byPriority: { [key in NotificationPriority]: number };
  recentActivity: Notification[];
}

// Interface pour les paramètres de notification utilisateur
export interface NotificationPreferences {
  userId: number;
  email: {
    enabled: boolean;
    types: NotificationType[];
  };
  push: {
    enabled: boolean;
    types: NotificationType[];
  };
  sms: {
    enabled: boolean;
    types: NotificationType[];
  };
  inApp: {
    enabled: boolean;
    types: NotificationType[];
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
}

// Interface pour les notifications push
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: NotificationData;
  actions?: PushNotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
  renotify?: boolean;
}

export interface PushNotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Interface pour les notifications par email
export interface EmailNotificationPayload {
  to: string;
  subject: string;
  template: string;
  data: NotificationData;
  priority: 'high' | 'normal' | 'low';
}

// Interface pour les notifications SMS
export interface SMSNotificationPayload {
  to: string;
  message: string;
  priority: 'high' | 'normal' | 'low';
}

// Interface pour les événements temps réel
export interface NotificationEvent {
  id: string;
  type: 'notification_created' | 'notification_updated' | 'notification_deleted';
  data: Notification;
  timestamp: Date;
  userId?: number;
  broadcast?: boolean;
}

// Interface pour les paramètres de diffusion
export interface BroadcastNotificationRequest {
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  category: NotificationCategory;
  targetUsers?: number[]; // Si non spécifié, tous les utilisateurs
  filters?: {
    userRoles?: string[];
    minOrders?: number;
    lastActivityDays?: number;
  };
  scheduledAt?: Date;
  expiresAt?: Date;
}