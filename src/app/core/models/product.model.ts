export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[]; // Jusqu'à 3 images, première obligatoire
  category: string;
  stock: number;
  rating?: number;
  status: ProductStatus; // pending, approved, rejected
  sellerId: string; // ID du vendeur qui a créé le produit
  createdAt: Date;
  updatedAt: Date;
  validatedBy?: string; // ID de l'admin qui a validé
  validatedAt?: Date;
  rejectionReason?: string;

  // Nouveaux champs pour la validation IA
  aiValidationStatus?: AIValidationStatus; // Statut de la validation par IA
  aiValidationDate?: Date; // Date de la validation IA
  aiValidationReason?: string; // Raison du rejet par IA
  aiValidationConfidence?: number; // Niveau de confiance de la validation IA (0-1)
  aiFlaggedCategories?: string[]; // Catégories inappropriées détectées

  // Statistics for dashboard
  views: number; // Number of times the product was viewed
  contactClicks: number; // Number of times contact button was clicked
  addToCartClicks: number; // Number of times add to cart was clicked
  whatsappClicks: number; // Number of times WhatsApp contact was used
}

export enum ProductStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum AIValidationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ERROR = 'error'
}