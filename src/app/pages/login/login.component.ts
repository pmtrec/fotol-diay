import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserRole } from '../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'] // ✅ "styleUrls" (pluriel)
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  async onSubmit() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      this.notificationService.showNotification('Veuillez remplir tous les champs.', 'warning');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const user = await this.authService.login({
        email: this.username,
        password: this.password
      });

      console.log('✅ Connexion réussie:', user);

      // Show success notification
      this.notificationService.showNotification(
        `Connexion réussie! Bienvenue ${user.firstName || user.username}`,
        'success'
      );

      // 🟢 Redirection selon le rôle (ou par défaut vers home)
      if (user.role === UserRole.ADMIN) {
        this.router.navigate(['/admin']);
      } else if (user.role === UserRole.SELLER) {
        this.router.navigate(['/vendeur']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);

      let errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect.';
      let notificationType: 'error' | 'warning' = 'error';

      if (error instanceof Error) {
        if (error.message.includes('serveur') || error.message.includes('404')) {
          errorMessage = 'Erreur de connexion au serveur. Vérifiez que le serveur est démarré.';
          notificationType = 'warning';
        } else if (error.message.includes('incorrect')) {
          errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect.';
        } else {
          errorMessage = error.message;
        }
      }

      this.errorMessage = errorMessage;

      // Show error notification
      this.notificationService.showNotification(errorMessage, notificationType);
    } finally {
      this.isLoading = false;
    }
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }
}
