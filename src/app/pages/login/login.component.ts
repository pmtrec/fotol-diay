import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
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

  constructor(private router: Router, private authService: AuthService) {}

  async onSubmit() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
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
      const errorMessage = error instanceof Error ? error.message : 'Nom d\'utilisateur ou mot de passe incorrect.';
      this.errorMessage = errorMessage;
    } finally {
      this.isLoading = false;
    }
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }
}
