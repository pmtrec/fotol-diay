import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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

  // 🧠 Simulation d'une "base de données" locale
  private mockUsers = [
    { username: 'admin', password: '123456', role: 'admin' },
    { username: 'kasongo', password: 'dev2025', role: 'user' },
    { username: 'guest', password: 'guest', role: 'visitor' }
  ];

  constructor(private router: Router) {}

  onSubmit() {
    const foundUser = this.mockUsers.find(
      user => user.username === this.username && user.password === this.password
    );

    if (foundUser) {
      console.log('✅ Connexion réussie:', foundUser);
      localStorage.setItem('currentUser', JSON.stringify(foundUser));

      // 🟢 Redirection selon le rôle (ou par défaut vers home)
      if (foundUser.role === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } else {
      console.warn('❌ Identifiants invalides');
      this.errorMessage = 'Nom d’utilisateur ou mot de passe incorrect.';
    }
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }
}
