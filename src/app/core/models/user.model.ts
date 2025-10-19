export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  whatsapp?: string; // Numéro WhatsApp du vendeur
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Informations spécifiques vendeur
  businessName?: string;
  businessDescription?: string;
  businessAddress?: string; // Adresse du vendeur
  businessPhone?: string; // Téléphone professionnel
  // Informations spécifiques admin
  permissions?: string[];
}

export enum UserRole {
  ADMIN = 'admin',
  SELLER = 'seller',
  CUSTOMER = 'customer'
}