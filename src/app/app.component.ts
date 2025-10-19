import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastNotificationComponent, ToastNotification } from './shared/components/common/toast-notification/toast-notification.component';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, ToastNotificationComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  protected readonly title = signal('frontend');
  toasts: ToastNotification[] = [];
  private toastsSubscription?: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    // S'abonner aux toasts du service de notification
    this.toastsSubscription = this.notificationService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  ngOnDestroy() {
    if (this.toastsSubscription) {
      this.toastsSubscription.unsubscribe();
    }
  }

  onToastClosed(toastId: string) {
    this.notificationService.removeToast(toastId);
  }
}
