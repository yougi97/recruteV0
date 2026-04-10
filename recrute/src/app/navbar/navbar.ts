import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DevAuth } from '../services/dev-auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule,RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  constructor(private devAuth: DevAuth, private router: Router) {}

  get isAuth(): boolean {
    return this.devAuth.isAuthenticated();
  }

  get displayName(): string {
    const u = this.devAuth.getCurrentUser();
    return u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() : '';
  }

  logout(): void {
    this.devAuth.logout();
    // après déconnexion, rediriger vers la page d'accueil
    this.router.navigate(['/']);
  }

  /** Retourne la route d'accueil à utiliser selon le type d'utilisateur */
  homeRoute(): string {
    const u = this.devAuth.getCurrentUser();
    if (!u) return '/';
    return u.user_type === 'company' ? '/users/company/' + u.id : '/candidate-home';
  }
}
