export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  images: string[]; // Jusqu'à 3 images, première obligatoire
  category: string;
  stock: number;
  rating?: number;
  status: ProductStatus; // pending, approved, rejected
  sellerId: number; // ID du vendeur qui a créé le produit
  createdAt: Date;
  updatedAt: Date;
  validatedBy?: number; // ID de l'admin qui a validé
  validatedAt?: Date;
  rejectionReason?: string;
}

export enum ProductStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}