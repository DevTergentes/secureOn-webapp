import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  username = '';
  email = '';
  password = '';
  role = 'COMPANY';
  fullName = '';
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSignup() {
    const signupData: any = {
      username: this.username,
      email: this.email,
      password: this.password,
      role: this.role
    };
    if (this.role === 'EMPLOYEE') {
      signupData.fullName = this.fullName;
    }
    this.authService.signup(signupData).subscribe({
      next: (res) => {
        // Puedes mostrar mensaje de éxito si quieres
        this.router.navigate(['/login']);
      },
    });
  }
}
