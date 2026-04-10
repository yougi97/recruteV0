// dev-auth.ts
// Service utilitaire pour les présentations : crée deux utilisateurs mock
// et fournit des méthodes pour se 'logger' en local (localStorage).
import { Injectable } from '@angular/core';

export interface MockUser {
  id: number;
  email: string;
  user_type: 'candidate' | 'company';
  first_name?: string;
  last_name?: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class DevAuth {
  private readonly LS_USER_KEY = 'dev_user';
  private readonly LS_TOKEN_KEY = 'dev_token';

  candidate: MockUser = {
    id: 100,
    email: 'candidate.demo@example.com',
    user_type: 'candidate',
    first_name: 'Demo',
    last_name: 'Candidate',
    created_at: new Date().toISOString(),
  };

  company: MockUser = {
    id: 200,
    email: 'company.demo@example.com',
    user_type: 'company',
    first_name: 'Demo',
    last_name: 'Company',
    created_at: new Date().toISOString(),
  };

  loginAsCandidate(): void {
    this.saveSession(this.candidate, 'token-candidate-mock');
  }

  loginAsCompany(): void {
    this.saveSession(this.company, 'token-company-mock');
  }

  logout(): void {
    localStorage.removeItem(this.LS_USER_KEY);
    localStorage.removeItem(this.LS_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.LS_TOKEN_KEY);
  }

  getCurrentUser(): MockUser | null {
    const raw = localStorage.getItem(this.LS_USER_KEY);
    return raw ? JSON.parse(raw) as MockUser : null;
  }

  private saveSession(user: MockUser, token: string) {
    localStorage.setItem(this.LS_USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.LS_TOKEN_KEY, token);
    // pour les autres services qui lisent 'user' depuis localStorage
    // on cadre ici le format minimal attendu par le projet
  }
}
