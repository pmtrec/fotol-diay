import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {}

  onSubmit() {
    // TODO: Implement register logic
    if (this.password !== this.confirmPassword) {
      console.error('Passwords do not match');
      return;
    }
    console.log('Registration attempt:', {
      username: this.username,
      email: this.email,
      password: this.password
    });
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}