import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  Payment,
  PaymentIntent,
  PaymentStatus,
  PaymentMethod,
  PaymentGateway,
  CreatePaymentRequest,
  ProcessPaymentRequest,
  RefundPaymentRequest,
  PaymentStats,
  PaymentWebhookEvent,
  PaymentError,
  PaymentErrorCode,
  PaymentErrorType,
  SavedPaymentMethod,
  PaymentGatewayConfig
} from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private paymentStatusSubject = new BehaviorSubject<PaymentStatus | null>(null);
  private paymentStatsSubject = new BehaviorSubject<PaymentStats | null>(null);

  public paymentStatus$ = this.paymentStatusSubject.asObservable();
  public paymentStats$ = this.paymentStatsSubject.asObservable();

  // Configuration des gateways
  private gatewayConfigs: { [key in PaymentGateway]: PaymentGatewayConfig } = {
    [PaymentGateway.STRIPE]: {
      gateway: PaymentGateway.STRIPE,
      enabled: true,
      supportedCurrencies: ['XOF', 'EUR', 'USD'],
      supportedMethods: [PaymentMethod.CARD],
      fees: { percentage: 2.9, fixed: 300, minAmount: 100, maxAmount: 5000000 }
    },
    [PaymentGateway.PAYPAL]: {
      gateway: PaymentGateway.PAYPAL,
      enabled: true,
      supportedCurrencies: ['XOF', 'EUR', 'USD'],
      supportedMethods: [PaymentMethod.PAYPAL],
      fees: { percentage: 3.4, fixed: 350, minAmount: 500, maxAmount: 10000000 }
    },
    [PaymentGateway.FLUTTERWAVE]: {
      gateway: PaymentGateway.FLUTTERWAVE,
      enabled: true,
      supportedCurrencies: ['XOF'],
      supportedMethods: [PaymentMethod.CARD, PaymentMethod.MOBILE_MONEY],
      fees: { percentage: 1.5, fixed: 200, minAmount: 100, maxAmount: 10000000 }
    },
    [PaymentGateway.PAYDUNYA]: {
      gateway: PaymentGateway.PAYDUNYA,
      enabled: true,
      supportedCurrencies: ['XOF'],
      supportedMethods: [PaymentMethod.CARD, PaymentMethod.MOBILE_MONEY],
      fees: { percentage: 2.0, fixed: 250, minAmount: 100, maxAmount: 2000000 }
    },
    [PaymentGateway.ORANGE_MONEY]: {
      gateway: PaymentGateway.ORANGE_MONEY,
      enabled: true,
      supportedCurrencies: ['XOF'],
      supportedMethods: [PaymentMethod.ORANGE_MONEY],
      fees: { percentage: 1.0, fixed: 100, minAmount: 100, maxAmount: 500000 }
    },
    [PaymentGateway.MTN_MOMO]: {
      gateway: PaymentGateway.MTN_MOMO,
      enabled: true,
      supportedCurrencies: ['XOF'],
      supportedMethods: [PaymentMethod.MTN_MONEY],
      fees: { percentage: 1.0, fixed: 100, minAmount: 100, maxAmount: 500000 }
    },
    [PaymentGateway.WAVE]: {
      gateway: PaymentGateway.WAVE,
      enabled: true,
      supportedCurrencies: ['XOF'],
      supportedMethods: [PaymentMethod.WAVE],
      fees: { percentage: 0.5, fixed: 50, minAmount: 100, maxAmount: 1000000 }
    }
  };

  constructor(private apiService: ApiService) {
    this.loadPaymentStats();
  }

  // =================== INTENTIONS DE PAIEMENT ===================

  /**
   * Créer une intention de paiement
   */
  createPaymentIntent(request: CreatePaymentRequest): Observable<PaymentIntent> {
    // Valider la requête
    const validation = this.validatePaymentRequest(request);
    if (!validation.valid) {
      return throwError(() => new Error(validation.errors.join(', ')));
    }

    return this.apiService.post<PaymentIntent>('/payments/intent', request).pipe(
      tap(intent => {
        this.paymentStatusSubject.next(PaymentStatus.PENDING);
      })
    );
  }

  /**
   * Confirmer une intention de paiement
   */
  confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string): Observable<Payment> {
    return this.apiService.post<Payment>(`/payments/intent/${paymentIntentId}/confirm`, {
      paymentMethodId
    }).pipe(
      tap(payment => {
        this.paymentStatusSubject.next(payment.status);
        this.loadPaymentStats();
      })
    );
  }

  /**
   * Annuler une intention de paiement
   */
  cancelPaymentIntent(paymentIntentId: string): Observable<PaymentIntent> {
    return this.apiService.post<PaymentIntent>(`/payments/intent/${paymentIntentId}/cancel`, {}).pipe(
      tap(() => {
        this.paymentStatusSubject.next(PaymentStatus.CANCELED);
      })
    );
  }

  // =================== TRAITEMENT DES PAIEMENTS ===================

  /**
   * Traiter un paiement avec une méthode spécifique
   */
  processPayment(request: ProcessPaymentRequest): Observable<Payment> {
    return this.apiService.post<Payment>('/payments/process', request).pipe(
      tap(payment => {
        this.paymentStatusSubject.next(payment.status);
        this.loadPaymentStats();
      }),
      catchError(error => {
        this.paymentStatusSubject.next(PaymentStatus.FAILED);
        return throwError(() => this.handlePaymentError(error));
      })
    );
  }

  /**
   * Récupérer le statut d'un paiement
   */
  getPaymentStatus(paymentId: string): Observable<Payment> {
    return this.apiService.get<Payment>(`/payments/${paymentId}`);
  }

  /**
   * Récupérer tous les paiements avec filtres
   */
  getPayments(filters?: {
    status?: PaymentStatus[];
    method?: PaymentMethod[];
    gateway?: PaymentGateway[];
    dateFrom?: Date;
    dateTo?: Date;
    minAmount?: number;
    maxAmount?: number;
  }): Observable<Payment[]> {
    let params = '';
    if (filters) {
      const searchParams = new URLSearchParams();
      if (filters.status?.length) searchParams.append('status', filters.status.join(','));
      if (filters.method?.length) searchParams.append('method', filters.method.join(','));
      if (filters.gateway?.length) searchParams.append('gateway', filters.gateway.join(','));
      if (filters.dateFrom) searchParams.append('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) searchParams.append('dateTo', filters.dateTo.toISOString());
      if (filters.minAmount) searchParams.append('minAmount', filters.minAmount.toString());
      if (filters.maxAmount) searchParams.append('maxAmount', filters.maxAmount.toString());
      params = '?' + searchParams.toString();
    }

    return this.apiService.get<Payment[]>(`/payments${params}`);
  }

  // =================== REMBOURSEMENTS ===================

  /**
   * Demander un remboursement
   */
  requestRefund(request: RefundPaymentRequest): Observable<Payment> {
    return this.apiService.post<Payment>(`/payments/${request.paymentId}/refund`, request).pipe(
      tap(payment => {
        this.loadPaymentStats();
      })
    );
  }

  /**
   * Traiter un remboursement automatique
   */
  processRefund(paymentId: string, amount?: number, reason?: string): Observable<Payment> {
    return this.apiService.post<Payment>(`/payments/${paymentId}/process-refund`, {
      amount,
      reason
    }).pipe(
      tap(payment => {
        this.loadPaymentStats();
      })
    );
  }

  // =================== MÉTHODES DE PAIEMENT SAUVEGARDÉES ===================

  /**
   * Récupérer les méthodes de paiement sauvegardées d'un client
   */
  getSavedPaymentMethods(customerId: number): Observable<SavedPaymentMethod[]> {
    return this.apiService.get<SavedPaymentMethod[]>(`/customers/${customerId}/payment-methods`);
  }

  /**
   * Ajouter une méthode de paiement
   */
  addPaymentMethod(customerId: number, paymentMethod: Omit<SavedPaymentMethod, 'id' | 'customerId' | 'createdAt'>): Observable<SavedPaymentMethod> {
    return this.apiService.post<SavedPaymentMethod>(`/customers/${customerId}/payment-methods`, paymentMethod);
  }

  /**
   * Supprimer une méthode de paiement
   */
  removePaymentMethod(customerId: number, paymentMethodId: string): Observable<void> {
    return this.apiService.delete<void>(`/customers/${customerId}/payment-methods/${paymentMethodId}`);
  }

  /**
   * Définir une méthode de paiement par défaut
   */
  setDefaultPaymentMethod(customerId: number, paymentMethodId: string): Observable<SavedPaymentMethod> {
    return this.apiService.patch<SavedPaymentMethod>(`/customers/${customerId}/payment-methods/${paymentMethodId}/default`, {});
  }

  // =================== WEBHOOKS ===================

  /**
   * Traiter un webhook de paiement
   */
  processWebhook(gateway: PaymentGateway, payload: any, signature: string): Observable<PaymentWebhookEvent> {
    return this.apiService.post<PaymentWebhookEvent>('/payments/webhook', {
      gateway,
      payload,
      signature
    }).pipe(
      tap(event => {
        this.loadPaymentStats();
      })
    );
  }

  /**
   * Récupérer les événements webhook récents
   */
  getWebhookEvents(limit: number = 50): Observable<PaymentWebhookEvent[]> {
    return this.apiService.get<PaymentWebhookEvent[]>(`/payments/webhook/events?limit=${limit}`);
  }

  // =================== STATISTIQUES ===================

  /**
   * Récupérer les statistiques de paiement
   */
  getPaymentStats(filters?: { dateFrom?: Date; dateTo?: Date; gateway?: PaymentGateway }): Observable<PaymentStats> {
    let params = '';
    if (filters) {
      const searchParams = new URLSearchParams();
      if (filters.dateFrom) searchParams.append('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) searchParams.append('dateTo', filters.dateTo.toISOString());
      if (filters.gateway) searchParams.append('gateway', filters.gateway);
      params = '?' + searchParams.toString();
    }

    return this.apiService.get<PaymentStats>(`/payments/stats${params}`);
  }

  // =================== CONFIGURATION ===================

  /**
   * Récupérer la configuration d'un gateway
   */
  getGatewayConfig(gateway: PaymentGateway): PaymentGatewayConfig {
    return this.gatewayConfigs[gateway];
  }

  /**
   * Vérifier si un gateway supporte une méthode et une devise
   */
  supportsPayment(gateway: PaymentGateway, method: PaymentMethod, currency: string): boolean {
    const config = this.gatewayConfigs[gateway];
    return config.enabled &&
           config.supportedMethods.includes(method) &&
           config.supportedCurrencies.includes(currency);
  }

  /**
   * Calculer les frais de paiement
   */
  calculateFees(gateway: PaymentGateway, amount: number): number {
    const config = this.gatewayConfigs[gateway];
    const percentageFee = (amount * config.fees.percentage) / 100;
    const fixedFee = config.fees.fixed;
    return percentageFee + fixedFee;
  }

  /**
   * Obtenir le montant total avec frais
   */
  getTotalWithFees(gateway: PaymentGateway, amount: number): number {
    return amount + this.calculateFees(gateway, amount);
  }

  // =================== VALIDATION ===================

  /**
   * Valider une requête de paiement
   */
  private validatePaymentRequest(request: CreatePaymentRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.orderId) {
      errors.push('ID de commande requis');
    }

    if (!request.amount || request.amount <= 0) {
      errors.push('Montant valide requis');
    }

    if (!request.currency) {
      errors.push('Devise requise');
    }

    if (!request.method) {
      errors.push('Méthode de paiement requise');
    }

    if (!request.customerInfo.email) {
      errors.push('Email du client requis');
    }

    if (!request.customerInfo.name) {
      errors.push('Nom du client requis');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Gérer les erreurs de paiement
   */
  private handlePaymentError(error: any): PaymentError {
    // Mapper les erreurs selon le type
    if (error.code) {
      return {
        code: error.code as PaymentErrorCode,
        message: error.message || 'Erreur de paiement inconnue',
        type: this.mapErrorCodeToType(error.code)
      };
    }

    return {
      code: PaymentErrorCode.PROCESSING_ERROR,
      message: error.message || 'Erreur de traitement du paiement',
      type: PaymentErrorType.API_ERROR
    };
  }

  private mapErrorCodeToType(code: string): PaymentError['type'] {
    if (code.includes('card')) return PaymentErrorType.CARD_ERROR;
    if (code.includes('authentication')) return PaymentErrorType.AUTHENTICATION_ERROR;
    if (code.includes('rate_limit')) return PaymentErrorType.RATE_LIMIT_ERROR;
    if (code.includes('invalid')) return PaymentErrorType.INVALID_REQUEST_ERROR;
    return PaymentErrorType.API_ERROR;
  }

  // =================== FONCTIONS PRIVÉES ===================

  private loadPaymentStats(): void {
    this.getPaymentStats().subscribe({
      next: (stats) => {
        this.paymentStatsSubject.next(stats);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques de paiement:', error);
      }
    });
  }

  // =================== UTILITAIRES ===================

  /**
   * Formater un montant pour l'affichage
   */
  formatAmount(amount: number, currency: string = 'XOF'): string {
    if (currency === 'XOF') {
      return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Obtenir la couleur pour un statut de paiement
   */
  getStatusColor(status: PaymentStatus): string {
    const colors = {
      [PaymentStatus.PENDING]: '#ffa500',
      [PaymentStatus.PROCESSING]: '#007bff',
      [PaymentStatus.SUCCEEDED]: '#28a745',
      [PaymentStatus.CANCELED]: '#6c757d',
      [PaymentStatus.FAILED]: '#dc3545',
      [PaymentStatus.REFUNDED]: '#17a2b8',
      [PaymentStatus.PARTIALLY_REFUNDED]: '#fd7e14'
    };
    return colors[status] || '#6c757d';
  }

  /**
   * Obtenir le libellé d'un statut de paiement
   */
  getStatusLabel(status: PaymentStatus): string {
    const labels = {
      [PaymentStatus.PENDING]: 'En attente',
      [PaymentStatus.PROCESSING]: 'En cours',
      [PaymentStatus.SUCCEEDED]: 'Réussi',
      [PaymentStatus.CANCELED]: 'Annulé',
      [PaymentStatus.FAILED]: 'Échoué',
      [PaymentStatus.REFUNDED]: 'Remboursé',
      [PaymentStatus.PARTIALLY_REFUNDED]: 'Partiellement remboursé'
    };
    return labels[status] || status;
  }

  /**
   * Obtenir le libellé d'une méthode de paiement
   */
  getMethodLabel(method: PaymentMethod): string {
    const labels = {
      [PaymentMethod.CARD]: 'Carte bancaire',
      [PaymentMethod.MOBILE_MONEY]: 'Mobile Money',
      [PaymentMethod.BANK_TRANSFER]: 'Virement bancaire',
      [PaymentMethod.PAYPAL]: 'PayPal',
      [PaymentMethod.CASH_ON_DELIVERY]: 'Paiement à la livraison',
      [PaymentMethod.ORANGE_MONEY]: 'Orange Money',
      [PaymentMethod.MTN_MONEY]: 'MTN Money',
      [PaymentMethod.WAVE]: 'Wave'
    };
    return labels[method] || method;
  }
}