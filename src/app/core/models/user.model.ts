export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Informations spécifiques vendeur
  businessName?: string;
  businessDescription?: string;
  // Informations spécifiques admin
  permissions?: string[];
}

export enum UserRole {
  ADMIN = 'admin',
  SELLER = 'seller',
  CUSTOMER = 'customer'
}