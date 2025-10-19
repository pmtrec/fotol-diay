import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  closable?: boolean;
}

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toasts; let i = index; trackBy: trackByFn"
        class="toast"
        [class]="'toast-' + toast.type"
        [style.transform]="'translateY(' + (i * -10) + 'px)'"
        [style.zIndex]="1000 - i"
      >
        <div class="toast-content">
          <div class="toast-icon">
            <span *ngIf="toast.type === 'success'">✓</span>
            <span *ngIf="toast.type === 'error'">⚠</span>
            <span *ngIf="toast.type === 'warning'">!</span>
            <span *ngIf="toast.type === 'info'">ℹ</span>
          </div>
          <div class="toast-text">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button
            *ngIf="toast.closable !== false"
            class="toast-close"
            (click)="closeToast(toast.id)"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
      pointer-events: none;
    }

    .toast {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      margin-bottom: 10px;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease-in-out;
      pointer-events: auto;
      overflow: hidden;
    }

    .toast.toast-success {
      border-left: 4px solid #28a745;
    }

    .toast.toast-error {
      border-left: 4px solid #dc3545;
    }

    .toast.toast-warning {
      border-left: 4px solid #ffc107;
    }

    .toast.toast-info {
      border-left: 4px solid #17a2b8;
    }

    .toast.show {
      opacity: 1;
      transform: translateX(0);
    }

    .toast-content {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      min-width: 300px;
    }

    .toast-icon {
      margin-right: 12px;
      font-size: 18px;
      line-height: 1;
      flex-shrink: 0;
    }

    .toast-success .toast-icon {
      color: #28a745;
    }

    .toast-error .toast-icon {
      color: #dc3545;
    }

    .toast-warning .toast-icon {
      color: #856404;
    }

    .toast-info .toast-icon {
      color: #0c5460;
    }

    .toast-text {
      flex: 1;
      margin-right: 12px;
    }

    .toast-title {
      font-weight: 600;
      margin-bottom: 4px;
      color: #333;
    }

    .toast-message {
      color: #666;
      font-size: 14px;
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      font-size: 20px;
      line-height: 1;
      color: #999;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .toast-close:hover {
      color: #333;
    }

    @media (max-width: 480px) {
      .toast-container {
        left: 10px;
        right: 10px;
        top: 10px;
        max-width: none;
      }

      .toast-content {
        min-width: auto;
      }
    }
  `]
})
export class ToastNotificationComponent implements OnInit, OnDestroy {
  @Input() toasts: ToastNotification[] = [];
  @Output() toastClosed = new EventEmitter<string>();

  ngOnInit() {
    // Animation d'entrée pour les nouveaux toasts
    setTimeout(() => {
      const toastElements = document.querySelectorAll('.toast');
      toastElements.forEach((element: Element) => {
        const htmlElement = element as HTMLElement;
        if (!htmlElement.classList.contains('show')) {
          htmlElement.classList.add('show');
        }
      });
    });
  }

  ngOnDestroy() {
    // Nettoyer les timers si nécessaire
  }

  trackByFn(index: number, item: ToastNotification): string {
    return item.id;
  }

  closeToast(id: string) {
    this.toastClosed.emit(id);
  }
}