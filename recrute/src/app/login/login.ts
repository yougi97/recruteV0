import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DevAuth } from '../services/dev-auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email = '';
  password = '';
  error = '';

  constructor(private devAuth: DevAuth, private router: Router) {}

  submit(): void {
    this.error = '';

    // Accept demo credentials for presentation
    if (this.email === 'candidate.demo@example.com' && this.password === 'demo') {
      this.devAuth.loginAsCandidate();
      this.router.navigate(['/profile']);
      return;
    }

    if (this.email === 'company.demo@example.com' && this.password === 'demo') {
      this.devAuth.loginAsCompany();
      this.router.navigate(['/profile']);
      return;
    }

    // Otherwise, show a friendly message — real backend not implemented
    this.error = "Identifiants non reconnus pour la démo. Utilisez 'candidate.demo@example.com' or 'company.demo@example.com' avec le mot de passe 'demo', ou cliquez sur les boutons de la navbar.";
  }
}
