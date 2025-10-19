import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User } from '../models/user.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class SellerService {

  constructor(private apiService: ApiService) { }

  /**
   * Récupère les informations d'un vendeur par son ID
   */
  getSellerById(sellerId: string): Observable<User> {
    return this.apiService.get<User>(`/users/${sellerId}`);
  }

  /**
   * Récupère tous les vendeurs actifs
   */
  getActiveSellers(): Observable<User[]> {
    return this.apiService.get<User[]>('/users?seller&isActive=true');
  }

  /**
   * Récupère les vendeurs qui ont des produits approuvés
   */
  getSellersWithApprovedProducts(): Observable<User[]> {
    // Cette méthode nécessiterait une logique plus complexe côté serveur
    // Pour l'instant, retournons tous les vendeurs actifs
    return this.getActiveSellers();
  }
}