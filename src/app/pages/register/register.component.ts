import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserRole } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  selectedRole: UserRole = UserRole.CUSTOMER;
  passwordError = '';
  registrationError = '';

  constructor(private router: Router, private authService: AuthService) {}

  async onSubmit() {
    // Reset errors
    this.passwordError = '';
    this.registrationError = '';

    // Validate passwords match
    if (this.password !== this.confirmPassword) {
      this.passwordError = 'Passwords do not match';
      return;
    }

    // Validate role selection
    if (!this.selectedRole) {
      this.registrationError = 'Please select an account type';
      return;
    }

    try {
      const user = await this.authService.register({
        username: this.username,
        email: this.email,
        password: this.password,
        role: this.selectedRole
      });

      console.log('Registration successful:', user);

      // Redirect to appropriate dashboard based on role
      if (this.selectedRole === UserRole.SELLER) {
        this.router.navigate(['/vendeur/dashboard']);
      } else {
        this.router.navigate(['/client/dashboard']);
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      this.registrationError = error.message || 'Registration failed. Please try again.';
    }
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}