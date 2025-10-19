import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap, filter } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationFilters,
  NotificationStats,
  NotificationPreferences,
  NotificationEvent,
  BroadcastNotificationRequest,
  PushNotificationPayload,
  EmailNotificationPayload,
  SMSNotificationPayload
} from '../models/notification.model';

// Interface pour les notifications toast simples
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  closable?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private notificationStatsSubject = new BehaviorSubject<NotificationStats | null>(null);

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();
  public notificationStats$ = this.notificationStatsSubject.asObservable();

  // Gestion des toasts
  private toastsSubject = new BehaviorSubject<ToastNotification[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  // Socket connection pour les notifications temps réel
  private socket: any;
  private isConnected = false;

  constructor(private supabaseService: SupabaseService) {
    this.initializeSocketConnection();
    this.loadNotifications();
    this.loadNotificationStats();
  }

  // =================== GESTION DES TOASTS ===================

  /**
   * Afficher une notification toast simple (remplacement des alertes)
   */
  showNotification(
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    title?: string,
    duration: number = 5000
  ): string {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const toast: ToastNotification = {
      id,
      type,
      title: title || this.getDefaultTitle(type),
      message,
      duration,
      closable: true
    };

    // Ajouter le toast à la liste
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);

    // Programmer la fermeture automatique
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }

    return id;
  }

  /**
   * Fermer un toast spécifique
   */
  removeToast(toastId: string): void {
    const currentToasts = this.toastsSubject.value;
    const filteredToasts = currentToasts.filter(toast => toast.id !== toastId);
    this.toastsSubject.next(filteredToasts);
  }

  /**
   * Fermer tous les toasts
   */
  clearAllToasts(): void {
    this.toastsSubject.next([]);
  }

  /**
   * Récupérer le titre par défaut selon le type
   */
  private getDefaultTitle(type: 'success' | 'error' | 'warning' | 'info'): string {
    const titles = {
      success: 'Succès',
      error: 'Erreur',
      warning: 'Attention',
      info: 'Information'
    };
    return titles[type];
  }

  // =================== GESTION DES NOTIFICATIONS ===================

  /**
   * Récupérer les notifications d'un utilisateur
   */
  getUserNotifications(userId: string, filters?: NotificationFilters): Observable<Notification[]> {
    return new Observable(observer => {
      let query = this.supabaseService.client
        .from('notifications')
        .select('*')
        .eq('userId', userId);

      if (filters) {
        if (filters.type?.length) {
          query = query.in('type', filters.type);
        }
        if (filters.category?.length) {
          query = query.in('category', filters.category);
        }
        if (filters.priority?.length) {
          query = query.in('priority', filters.priority);
        }
        if (filters.read !== undefined) {
          query = query.eq('read', filters.read);
        }
        if (filters.dateFrom) {
          query = query.gte('createdAt', filters.dateFrom.toISOString());
        }
        if (filters.dateTo) {
          query = query.lte('createdAt', filters.dateTo.toISOString());
        }
        if (filters.search) {
          query = query.or(`title.ilike.%${filters.search}%,message.ilike.%${filters.search}%`);
        }
      }

      query
        .order('createdAt', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            observer.error(error);
          } else {
            observer.next(data as Notification[]);
            observer.complete();
          }
        });
    });
  }

  /**
   * Marquer une notification comme lue
   */
  markAsRead(notificationId: string): Observable<Notification> {
    return new Observable(observer => {
      this.supabaseService.client
        .from('notifications')
        .update({
          read: true,
          readAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', notificationId)
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            observer.error(error);
          } else {
            this.updateNotificationInList(data as Notification);
            this.updateUnreadCount();
            observer.next(data as Notification);
            observer.complete();
          }
        });
    });
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  markAllAsRead(userId: string): Observable<void> {
    return new Observable(observer => {
      this.supabaseService.client
        .from('notifications')
        .update({
          read: true,
          readAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('userId', userId)
        .eq('read', false)
        .then(({ error }) => {
          if (error) {
            observer.error(error);
          } else {
            this.loadNotifications();
            this.updateUnreadCount();
            observer.next();
            observer.complete();
          }
        });
    });
  }

  /**
   * Supprimer une notification
   */
  deleteNotification(notificationId: string): Observable<void> {
    return new Observable(observer => {
      this.supabaseService.client
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .then(({ error }) => {
          if (error) {
            observer.error(error);
          } else {
            this.removeNotificationFromList(notificationId);
            this.updateUnreadCount();
            observer.next();
            observer.complete();
          }
        });
    });
  }

  /**
   * Supprimer toutes les notifications lues
   */
  deleteAllRead(userId: string): Observable<void> {
    return new Observable(observer => {
      this.supabaseService.client
        .from('notifications')
        .delete()
        .eq('userId', userId)
        .eq('read', true)
        .then(({ error }) => {
          if (error) {
            observer.error(error);
          } else {
            this.loadNotifications();
            this.updateUnreadCount();
            observer.next();
            observer.complete();
          }
        });
    });
  }

  // =================== NOTIFICATIONS TEMPS RÉEL ===================

  /**
   * Créer une notification personnalisée
   */
  createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Observable<Notification> {
    return new Observable(observer => {
      this.supabaseService.client
        .from('notifications')
        .insert({
          ...notification,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            observer.error(error);
          } else {
            const newNotification = data as Notification;
            this.addNotificationToList(newNotification);
            this.updateUnreadCount();

            // Émettre via socket si connecté
            if (this.isConnected) {
              this.emitNotificationEvent('notification_created', newNotification);
            }

            observer.next(newNotification);
            observer.complete();
          }
        });
    });
  }

  /**
   * Diffuser une notification à tous les utilisateurs
   */
  broadcastNotification(request: BroadcastNotificationRequest): Observable<Notification[]> {
    return new Observable(observer => {
      // Get all users to broadcast to
      this.supabaseService.client
        .from('users')
        .select('id')
        .then(({ data: users, error: usersError }) => {
          if (usersError) {
            observer.error(usersError);
            return;
          }

          // Create notifications for all users
          const notifications = users?.map(user => ({
            ...request,
            userId: user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })) || [];

          // Insert all notifications
          this.supabaseService.client
            .from('notifications')
            .insert(notifications)
            .select()
            .then(({ data, error }) => {
              if (error) {
                observer.error(error);
              } else {
                const createdNotifications = data as Notification[];
                createdNotifications.forEach(notification => {
                  this.addNotificationToList(notification);
                });
                this.updateUnreadCount();
                observer.next(createdNotifications);
                observer.complete();
              }
            });
        });
    });
  }

  /**
   * Programmer une notification
   */
  scheduleNotification(scheduledTime: Date, notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Observable<Notification> {
    return new Observable(observer => {
      this.supabaseService.client
        .from('scheduled_notifications')
        .insert({
          scheduledTime: scheduledTime.toISOString(),
          notification: {
            ...notification,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            observer.error(error);
          } else {
            observer.next(data.notification as Notification);
            observer.complete();
          }
        });
    });
  }

  // =================== NOTIFICATIONS PUSH ===================

  /**
   * Envoyer une notification push
   */
  sendPushNotification(userId: string, payload: PushNotificationPayload): Observable<void> {
    return new Observable(observer => {
      // For now, we'll just create a notification in the database
      // In a real implementation, you'd integrate with a push notification service
      this.supabaseService.client
        .from('notifications')
        .insert({
          userId,
          type: 'PUSH_NOTIFICATION',
          title: payload.title,
          message: payload.body,
          data: payload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .then(({ error }) => {
          if (error) {
            observer.error(error);
          } else {
            observer.next();
            observer.complete();
          }
        });
    });
  }

  /**
   * S'abonner aux notifications push du navigateur
   */
  async subscribeToPushNotifications(userId: string): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'BKxQ6vX8Z9Y4nH5mJ2kL8pQ3rT7uV9wX1yA5bC6dE8fG2hI4jK7lM9nO1pR3sT5uV7wX9yA2bC4dE6fG8hI1jK3lM5nO7pQ9rS2tU4vW6xY8zA'
        ) as BufferSource
      });

      // Sauvegarder l'abonnement côté serveur
      await this.supabaseService.client
        .from('push_subscriptions')
        .insert({
          userId,
          subscription: subscription.toJSON(),
          createdAt: new Date().toISOString()
        });

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  // =================== NOTIFICATIONS EMAIL & SMS ===================

  /**
   * Envoyer une notification par email
   */
  sendEmailNotification(payload: EmailNotificationPayload): Observable<void> {
    return new Observable(observer => {
      // For now, we'll just log the email notification
      // In a real implementation, you'd integrate with an email service
      console.log('Email notification:', payload);
      observer.next();
      observer.complete();
    });
  }

  /**
   * Envoyer une notification par SMS
   */
  sendSMSNotification(payload: SMSNotificationPayload): Observable<void> {
    return new Observable(observer => {
      // For now, we'll just log the SMS notification
      // In a real implementation, you'd integrate with an SMS service
      console.log('SMS notification:', payload);
      observer.next();
      observer.complete();
    });
  }

  // =================== PRÉFÉRENCES UTILISATEUR ===================

  /**
   * Récupérer les préférences de notification d'un utilisateur
   */
  getNotificationPreferences(userId: string): Observable<NotificationPreferences> {
    return new Observable(observer => {
      this.supabaseService.client
        .from('notification_preferences')
        .select('*')
        .eq('userId', userId)
        .single()
        .then(({ data, error }) => {
          if (error) {
            observer.error(error);
          } else {
            observer.next(data as NotificationPreferences);
            observer.complete();
          }
        });
    });
  }

  /**
   * Mettre à jour les préférences de notification
   */
  updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Observable<NotificationPreferences> {
    return new Observable(observer => {
      this.supabaseService.client
        .from('notification_preferences')
        .upsert({
          userId,
          ...preferences,
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            observer.error(error);
          } else {
            observer.next(data as NotificationPreferences);
            observer.complete();
          }
        });
    });
  }

  // =================== STATISTIQUES ===================

  /**
   * Récupérer les statistiques de notifications
   */
  getNotificationStats(userId: string): Observable<NotificationStats> {
    return new Observable(observer => {
      this.supabaseService.client
        .from('notifications')
        .select('type, category, priority, read')
        .eq('userId', userId)
        .then(({ data, error }) => {
          if (error) {
            observer.error(error);
          } else {
            const notifications = data as Notification[];
            const stats: NotificationStats = {
              total: notifications.length,
              unread: notifications.filter(n => !n.read).length,
              byType: {} as any,
              byCategory: {} as any,
              byPriority: {} as any,
              recentActivity: []
            };

            // Calculate stats by type, category, and priority
            notifications.forEach(notification => {
              // By type
              if (!stats.byType[notification.type]) {
                stats.byType[notification.type] = 0;
              }
              stats.byType[notification.type]++;

              // By category
              if (!stats.byCategory[notification.category]) {
                stats.byCategory[notification.category] = 0;
              }
              stats.byCategory[notification.category]++;

              // By priority
              if (!stats.byPriority[notification.priority]) {
                stats.byPriority[notification.priority] = 0;
              }
              stats.byPriority[notification.priority]++;
            });

            observer.next(stats);
            observer.complete();
          }
        });
    });
  }

  // =================== SOCKET.IO INTEGRATION ===================

  /**
   * Initialiser la connexion Socket.IO
   */
  private initializeSocketConnection(): void {
    // Note: En environnement réel, remplacer par une vraie connexion Socket.IO
    // Pour le développement, on simule les événements
    this.simulateRealTimeNotifications();
  }

  /**
   * Émettre un événement de notification via Socket
   */
  private emitNotificationEvent(type: string, notification: Notification): void {
    if (this.socket && this.socket.emit) {
      this.socket.emit('notification_event', {
        type,
        data: notification,
        timestamp: new Date()
      });
    }
  }

  /**
   * Écouter les événements de notification
   */
  listenForNotifications(userId: string): Observable<NotificationEvent> {
    return new Observable(subscriber => {
      if (this.socket) {
        this.socket.on(`notification_${userId}`, (event: NotificationEvent) => {
          subscriber.next(event);
        });
      } else {
        // Simulation pour le développement
        console.log('Socket not connected, using simulation mode');
      }
    });
  }

  // =================== FONCTIONS DE SIMULATION ===================

  /**
   * Simuler les notifications temps réel (pour le développement)
   */
  private simulateRealTimeNotifications(): void {
    // Simulation de nouvelles notifications toutes les 30 secondes
    setInterval(() => {
      if (Math.random() > 0.7) { // 30% de chance de nouvelle notification
        this.simulateNewNotification();
      }
    }, 30000);
  }

  /**
   * Simuler une nouvelle notification
   */
  private simulateNewNotification(): void {
    const notificationTypes = Object.values(NotificationType);
    const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];

    const sampleNotification: Notification = {
      id: `sim_${Date.now()}`,
      userId: 'admin-1', // Simulation pour l'admin
      type: randomType,
      title: this.getNotificationTitle(randomType),
      message: this.getNotificationMessage(randomType),
      read: false,
      priority: Math.random() > 0.8 ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
      category: this.getNotificationCategory(randomType),
      createdAt: new Date(),
      updatedAt: new Date(),
      data: {
        productId: `prod-${Math.floor(Math.random() * 10) + 1}`,
        amount: Math.floor(Math.random() * 100000) + 10000
      }
    };

    this.addNotificationToList(sampleNotification);
    this.updateUnreadCount();
  }

  // =================== FONCTIONS PRIVÉES ===================

  private loadNotifications(): void {
    // Simulation : en environnement réel, remplacer par un appel API
    const mockNotifications: Notification[] = [
      {
        id: '1',
        userId: 'admin-1',
        type: NotificationType.ORDER_CREATED,
        title: 'Nouvelle commande reçue',
        message: 'Vous avez reçu une nouvelle commande #KL12345',
        read: false,
        priority: NotificationPriority.HIGH,
        category: NotificationCategory.ORDERS,
        createdAt: new Date(Date.now() - 300000), // 5 minutes ago
        updatedAt: new Date(Date.now() - 300000),
        data: { orderId: 'order-1', amount: 150000 }
      },
      {
        id: '2',
        userId: 'admin-1',
        type: NotificationType.PRODUCT_APPROVED,
        title: 'Produit approuvé',
        message: 'Votre produit "iPhone 15 Pro Max" a été approuvé',
        read: true,
        priority: NotificationPriority.NORMAL,
        category: NotificationCategory.PRODUCTS,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        updatedAt: new Date(Date.now() - 3600000),
        data: { productId: 'prod-1' }
      }
    ];

    this.notificationsSubject.next(mockNotifications);
    this.updateUnreadCount();
  }

  private loadNotificationStats(): void {
    const mockStats: NotificationStats = {
      total: 15,
      unread: 3,
      byType: {
        [NotificationType.ORDER_CREATED]: 5,
        [NotificationType.PRODUCT_APPROVED]: 3,
        [NotificationType.PAYMENT_SUCCEEDED]: 2,
        [NotificationType.NEW_REVIEW]: 1,
        [NotificationType.SYSTEM_UPDATE]: 1,
        [NotificationType.ORDER_SHIPPED]: 2,
        [NotificationType.PRODUCT_LOW_STOCK]: 1,
        [NotificationType.CUSTOMER_ORDER_UPDATE]: 0,
        [NotificationType.CUSTOMER_PROMOTION]: 0,
        [NotificationType.CUSTOMER_WISHLIST_PRICE_DROP]: 0,
        [NotificationType.ORDER_CANCELLED]: 0,
        [NotificationType.ORDER_DELIVERED]: 0,
        [NotificationType.ORDER_UPDATED]: 0,
        [NotificationType.PAYMENT_FAILED]: 0,
        [NotificationType.PAYMENT_REFUNDED]: 0,
        [NotificationType.PRODUCT_OUT_OF_STOCK]: 0,
        [NotificationType.PRODUCT_REJECTED]: 0,
        [NotificationType.REVIEW_APPROVED]: 0,
        [NotificationType.REVIEW_REJECTED]: 0,
        [NotificationType.SELLER_NEW_ORDER]: 0,
        [NotificationType.SELLER_PRODUCT_SOLD]: 0,
        [NotificationType.SELLER_REVIEW_RECEIVED]: 0,
        [NotificationType.SYSTEM_MAINTENANCE]: 0,
        [NotificationType.SECURITY_ALERT]: 0
      },
      byCategory: {
        [NotificationCategory.ORDERS]: 7,
        [NotificationCategory.PRODUCTS]: 4,
        [NotificationCategory.PAYMENTS]: 2,
        [NotificationCategory.REVIEWS]: 1,
        [NotificationCategory.SYSTEM]: 1,
        [NotificationCategory.PROMOTIONS]: 0
      },
      byPriority: {
        [NotificationPriority.LOW]: 2,
        [NotificationPriority.NORMAL]: 10,
        [NotificationPriority.HIGH]: 3,
        [NotificationPriority.URGENT]: 0
      },
      recentActivity: []
    };

    this.notificationStatsSubject.next(mockStats);
  }

  private addNotificationToList(notification: Notification): void {
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...currentNotifications]);
  }

  private updateNotificationInList(updatedNotification: Notification): void {
    const currentNotifications = this.notificationsSubject.value;
    const index = currentNotifications.findIndex(n => n.id === updatedNotification.id);
    if (index !== -1) {
      currentNotifications[index] = updatedNotification;
      this.notificationsSubject.next([...currentNotifications]);
    }
  }

  private removeNotificationFromList(notificationId: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const filteredNotifications = currentNotifications.filter(n => n.id !== notificationId);
    this.notificationsSubject.next(filteredNotifications);
  }

  private updateUnreadCount(): void {
    const currentNotifications = this.notificationsSubject.value;
    const unreadCount = currentNotifications.filter(n => !n.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  // =================== UTILITAIRES ===================

  private getNotificationTitle(type: NotificationType): string {
    const titles = {
      [NotificationType.ORDER_CREATED]: 'Nouvelle commande',
      [NotificationType.ORDER_UPDATED]: 'Commande mise à jour',
      [NotificationType.ORDER_SHIPPED]: 'Commande expédiée',
      [NotificationType.ORDER_DELIVERED]: 'Commande livrée',
      [NotificationType.ORDER_CANCELLED]: 'Commande annulée',
      [NotificationType.PAYMENT_SUCCEEDED]: 'Paiement réussi',
      [NotificationType.PAYMENT_FAILED]: 'Échec du paiement',
      [NotificationType.PAYMENT_REFUNDED]: 'Paiement remboursé',
      [NotificationType.PRODUCT_APPROVED]: 'Produit approuvé',
      [NotificationType.PRODUCT_REJECTED]: 'Produit rejeté',
      [NotificationType.PRODUCT_LOW_STOCK]: 'Stock faible',
      [NotificationType.PRODUCT_OUT_OF_STOCK]: 'Stock épuisé',
      [NotificationType.REVIEW_APPROVED]: 'Avis approuvé',
      [NotificationType.REVIEW_REJECTED]: 'Avis rejeté',
      [NotificationType.NEW_REVIEW]: 'Nouvel avis',
      [NotificationType.SYSTEM_UPDATE]: 'Mise à jour système',
      [NotificationType.SYSTEM_MAINTENANCE]: 'Maintenance système',
      [NotificationType.SECURITY_ALERT]: 'Alerte de sécurité',
      [NotificationType.SELLER_NEW_ORDER]: 'Nouvelle commande vendeur',
      [NotificationType.SELLER_PRODUCT_SOLD]: 'Produit vendu',
      [NotificationType.SELLER_REVIEW_RECEIVED]: 'Nouvel avis vendeur',
      [NotificationType.CUSTOMER_ORDER_UPDATE]: 'Mise à jour commande client',
      [NotificationType.CUSTOMER_PROMOTION]: 'Promotion client',
      [NotificationType.CUSTOMER_WISHLIST_PRICE_DROP]: 'Baisse de prix liste de souhaits'
    };
    return titles[type] || 'Notification';
  }

  private getNotificationMessage(type: NotificationType): string {
    const messages = {
      [NotificationType.ORDER_CREATED]: 'Une nouvelle commande a été passée',
      [NotificationType.ORDER_UPDATED]: 'Le statut de votre commande a changé',
      [NotificationType.ORDER_SHIPPED]: 'Votre commande a été expédiée',
      [NotificationType.ORDER_DELIVERED]: 'Votre commande a été livrée',
      [NotificationType.ORDER_CANCELLED]: 'Votre commande a été annulée',
      [NotificationType.PAYMENT_SUCCEEDED]: 'Votre paiement a été traité avec succès',
      [NotificationType.PAYMENT_FAILED]: 'Votre paiement a échoué',
      [NotificationType.PAYMENT_REFUNDED]: 'Votre paiement a été remboursé',
      [NotificationType.PRODUCT_APPROVED]: 'Votre produit a été approuvé par l\'administrateur',
      [NotificationType.PRODUCT_REJECTED]: 'Votre produit a été rejeté par l\'administrateur',
      [NotificationType.PRODUCT_LOW_STOCK]: 'Votre produit a un stock faible',
      [NotificationType.PRODUCT_OUT_OF_STOCK]: 'Votre produit est en rupture de stock',
      [NotificationType.REVIEW_APPROVED]: 'Votre avis a été approuvé',
      [NotificationType.REVIEW_REJECTED]: 'Votre avis a été rejeté',
      [NotificationType.NEW_REVIEW]: 'Vous avez reçu un nouvel avis',
      [NotificationType.SYSTEM_UPDATE]: 'Le système a été mis à jour',
      [NotificationType.SYSTEM_MAINTENANCE]: 'Le système est en maintenance',
      [NotificationType.SECURITY_ALERT]: 'Une alerte de sécurité a été détectée',
      [NotificationType.SELLER_NEW_ORDER]: 'Vous avez reçu une nouvelle commande',
      [NotificationType.SELLER_PRODUCT_SOLD]: 'Votre produit a été vendu',
      [NotificationType.SELLER_REVIEW_RECEIVED]: 'Vous avez reçu un avis sur votre produit',
      [NotificationType.CUSTOMER_ORDER_UPDATE]: 'Votre commande a été mise à jour',
      [NotificationType.CUSTOMER_PROMOTION]: 'Une nouvelle promotion est disponible',
      [NotificationType.CUSTOMER_WISHLIST_PRICE_DROP]: 'Un produit de votre liste de souhaits a baissé de prix'
    };
    return messages[type] || 'Vous avez une nouvelle notification';
  }

  private getNotificationCategory(type: NotificationType): NotificationCategory {
    if (Object.values(NotificationType).filter(t => t.includes('ORDER')).includes(type)) {
      return NotificationCategory.ORDERS;
    }
    if (Object.values(NotificationType).filter(t => t.includes('PAYMENT')).includes(type)) {
      return NotificationCategory.PAYMENTS;
    }
    if (Object.values(NotificationType).filter(t => t.includes('PRODUCT')).includes(type)) {
      return NotificationCategory.PRODUCTS;
    }
    if (Object.values(NotificationType).filter(t => t.includes('REVIEW')).includes(type)) {
      return NotificationCategory.REVIEWS;
    }
    return NotificationCategory.SYSTEM;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Nettoyer les ressources
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }
}