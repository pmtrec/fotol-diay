export interface Review {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  orderId?: string; // Référence à la commande pour vérification
  rating: number; // 1 à 5 étoiles
  title: string;
  comment: string;
  pros?: string[]; // Points positifs
  cons?: string[]; // Points négatifs
  images?: string[]; // Photos du produit en utilisation
  verified: boolean; // Achat vérifié
  helpful: number; // Nombre d'utilisateurs qui trouvent ça utile
  notHelpful: number;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
  moderatedBy?: string; // ID de l'admin qui a modéré
  moderatedAt?: Date;
  moderationReason?: string;
  response?: ReviewResponse; // Réponse du vendeur
}

export interface ReviewResponse {
  id: string;
  sellerId: string;
  sellerName: string;
  comment: string;
  createdAt: Date;
}

export interface ProductReviewStats {
  productId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number }; // {5: 10, 4: 5, 3: 2, 2: 1, 1: 0}
  verifiedReviews: number;
  withImages: number;
  responseRate: number; // Pourcentage de reviews avec réponse vendeur
}

export interface ReviewFilters {
  productId?: string;
  customerId?: string;
  sellerId?: string;
  rating?: number[];
  verified?: boolean;
  withImages?: boolean;
  status?: ReviewStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export enum ReviewStatus {
  PENDING = 'pending',     // En attente de modération
  APPROVED = 'approved',   // Approuvé et visible
  REJECTED = 'rejected',   // Rejeté par modération
  FLAGGED = 'flagged',     // Signalé par utilisateurs
  HIDDEN = 'hidden'        // Masqué temporairement
}

export interface CreateReviewRequest {
  productId: string;
  orderId?: string;
  rating: number;
  title: string;
  comment: string;
  pros?: string[];
  cons?: string[];
  images?: string[];
}

export interface ReviewHelpfulAction {
  reviewId: string;
  userId: string;
  helpful: boolean; // true = helpful, false = not helpful
}

export interface ReviewReport {
  id: string;
  reviewId: string;
  reportedBy: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export enum ReportReason {
  SPAM = 'spam',
  INAPPROPRIATE = 'inappropriate',
  FAKE = 'fake',
  OFFENSIVE = 'offensive',
  IRRELEVANT = 'irrelevant',
  OTHER = 'other'
}

export enum ReportStatus {
  PENDING = 'pending',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

// Interfaces pour les statistiques vendeur
export interface SellerReviewStats {
 sellerId: string;
 averageRating: number;
 totalReviews: number;
 responseRate: number;
 responseTime: number; // Temps moyen de réponse en heures
 reviewsByMonth: { month: string; count: number; averageRating: number }[];
 topRatedProducts: { productId: string; productName: string; averageRating: number; reviewCount: number }[];
  recentReviews: Review[];
}