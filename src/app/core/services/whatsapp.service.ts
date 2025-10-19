import { Injectable } from '@angular/core';
import { Product } from '../models/product.model';
import { Cart, CartItem } from '../models/cart.model';
import { User } from '../models/user.model';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class WhatsAppService {

  constructor(private notificationService: NotificationService) { }

  /**
   * Génère un message WhatsApp pour un produit spécifique
   */
  generateProductMessage(product: Product, seller: User): string {
    const message = `Bonjour ${seller.firstName || seller.businessName || 'Vendeur'},

Je suis intéressé(e) par votre produit:
📱 *${product.name}*
💰 Prix: ${this.formatPrice(product.price)}
📦 Stock: ${product.stock} unités
📝 Description: ${product.description}

Pouvez-vous me donner plus d'informations sur ce produit?

Merci!`;

    return encodeURIComponent(message);
  }

  /**
   * Génère un message WhatsApp pour le panier complet
   */
  generateCartMessage(cart: Cart, seller: User): string {
    let message = `Bonjour ${seller.firstName || seller.businessName || 'Vendeur'},

Je suis intéressé(e) par plusieurs de vos produits:

🛒 *MA COMMANDE* 🛒
`;

    // Grouper les produits par vendeur si nécessaire
    const sellerProducts = cart.items
      .filter(item => item.product.sellerId === seller.id)
      .map(item => item.product);

    if (sellerProducts.length === 0) {
      message += `Aucun produit de votre boutique dans le panier.`;
    } else {
      sellerProducts.forEach((product, index) => {
        const cartItem = cart.items.find(item => item.product.id === product.id);
        const quantity = cartItem?.quantity || 1;
        message += `
${index + 1}. *${product.name}*
   💰 Prix: ${this.formatPrice(product.price)}
   📦 Quantité: ${quantity}
   💝 Total: ${this.formatPrice(product.price * quantity)}`;
      });

      message += `

💰 *TOTAL: ${this.formatPrice(cart.total)}*

Pouvez-vous me confirmer la disponibilité et organiser la livraison?

Merci!`;
    }

    return encodeURIComponent(message);
  }

  /**
   * Ouvre WhatsApp avec le numéro et le message
   */
  openWhatsApp(phoneNumber: string, message: string): void {
    // Nettoyer le numéro de téléphone
    let cleanNumber = phoneNumber.replace(/\D/g, '');

    // Handle different Senegal phone number formats
    if (cleanNumber.startsWith('00')) {
      // Convert international format (00221XXXXXXXXX) to local
      cleanNumber = cleanNumber.substring(2);
    } else if (cleanNumber.startsWith('0') && cleanNumber.length === 9) {
      // Local format (0XXXXXXXXX) - add country code
      cleanNumber = `221${cleanNumber}`;
    } else if (!cleanNumber.startsWith('221')) {
      // Add country code if not present
      cleanNumber = `221${cleanNumber}`;
    }

    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;

    // Ouvrir dans une nouvelle fenêtre
    window.open(whatsappUrl, '_blank');
  }

  /**
   * Contacte un vendeur pour un produit spécifique
   */
  contactSellerForProduct(product: Product, seller: User): void {
    if (!seller.whatsapp && !seller.phone) {
      this.notificationService.showNotification('Le vendeur n\'a pas fourni de numéro de contact.', 'warning');
      return;
    }

    const contactNumber = seller.whatsapp || seller.phone || '';
    const message = this.generateProductMessage(product, seller);

    this.openWhatsApp(contactNumber, message);
  }

  /**
   * Contacte un vendeur pour le panier
   */
  contactSellerForCart(cart: Cart, seller: User): void {
    if (!seller.whatsapp && !seller.phone) {
      this.notificationService.showNotification('Le vendeur n\'a pas fourni de numéro de contact.', 'warning');
      return;
    }

    const contactNumber = seller.whatsapp || seller.phone || '';
    const message = this.generateCartMessage(cart, seller);

    this.openWhatsApp(contactNumber, message);
  }

  /**
   * Formatage du prix en FCFA
   */
  private formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  }

  /**
   * Appelle directement un vendeur
   */
  callSeller(phoneNumber: string): void {
    let cleanNumber = phoneNumber.replace(/\D/g, '');

    // Handle different Senegal phone number formats
    if (cleanNumber.startsWith('00')) {
      // Convert international format (00221XXXXXXXXX) to local
      cleanNumber = cleanNumber.substring(2);
    } else if (cleanNumber.startsWith('0') && cleanNumber.length === 9) {
      // Local format (0XXXXXXXXX) - add country code
      cleanNumber = `221${cleanNumber}`;
    } else if (!cleanNumber.startsWith('221')) {
      // Add country code if not present
      cleanNumber = `221${cleanNumber}`;
    }

    window.location.href = `tel:+${cleanNumber}`;
  }
}