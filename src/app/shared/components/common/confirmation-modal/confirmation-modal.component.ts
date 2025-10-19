import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss']
})
export class ConfirmationModalComponent {
  @Input() isVisible = false;
  @Input() title = 'Confirmation';
  @Input() message = 'Êtes-vous sûr de vouloir continuer ?';
  @Input() confirmButtonText = 'Confirmer';
  @Input() cancelButtonText = 'Annuler';
  @Input() isDestructive = true; // Red button for dangerous actions
  @Input() isLoading = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  onConfirm(): void {
    if (!this.isLoading) {
      this.confirmed.emit();
    }
  }

  onCancel(): void {
    if (!this.isLoading) {
      this.cancelled.emit();
      this.close();
    }
  }

  onBackdropClick(): void {
    this.onCancel();
  }

  onCloseClick(): void {
    this.onCancel();
  }

  close(): void {
    this.isVisible = false;
    this.closed.emit();
  }

  open(): void {
    this.isVisible = true;
  }
}