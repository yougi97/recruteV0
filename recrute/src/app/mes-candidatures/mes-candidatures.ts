import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth';
import { ChatComponent } from '../components/chat/chat';

interface CandidatureItem {
  applicationId: number;
  status: 'attente' | 'encours' | 'accepte' | 'refuse' | 'prospection';
  appliedAt: string | null;
  jobOfferId: number;
  jobTitle: string;
  companyName: string;
  companyInitial: string;
  companyColor: string;
  location: string;
  contractType: string;
  companyUserId?: number;
}

interface InterestedOfferItem {
  applicationId: number;
  jobOfferId: number;
  jobTitle: string;
  companyName: string;
  companyInitial: string;
  companyColor: string;
  location: string;
  contractType: string;
  status: string;
  companyUserId?: number;
}

@Component({
  selector: 'app-mes-candidatures',
  standalone: true,
  imports: [CommonModule, RouterModule, ChatComponent],
  templateUrl: './mes-candidatures.html',
  styleUrls: ['./mes-candidatures.scss'],
})
export class MesCandidaturesComponent implements OnInit {
  candidatures: CandidatureItem[] = [];
  interestedOffers: InterestedOfferItem[] = [];
  loading = true;
  loadingInterested = false;
  error = '';
  retractingId: number | null = null;
  userId = 0;
  openChatOfferId: number | null = null;

  get totalCount() { return this.candidatures.length; }
  get pendingCount() { return this.candidatures.filter(c => c.status === 'attente').length; }
  get acceptedCount() { return this.candidatures.filter(c => c.status === 'accepte').length; }
  get interestedCount() { return this.interestedOffers.length; }

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userId = Number(localStorage.getItem('user_id'));
    if (!this.userId) {
      this.error = 'Utilisateur non connecté.';
      this.loading = false;
      return;
    }
    this.loadCandidatures();
    this.loadInterestedOffers();
  }

  loadCandidatures(): void {
    this.loading = true;
    this.error = '';
    this.authService.getCandidateApplications(this.userId).subscribe({
      next: (data) => {
        this.candidatures = data.map((item: any) => ({
          applicationId: Number(item.applicationId ?? 0),
          status: item.status ?? 'attente',
          appliedAt: item.appliedAt ?? null,
          jobOfferId: Number(item.jobOfferId ?? 0),
          jobTitle: item.jobTitle ?? 'Offre inconnue',
          companyName: item.companyName ?? 'Entreprise inconnue',
          companyInitial: item.companyInitial ?? '?',
          companyColor: item.companyColor ?? 'blue',
          location: item.location ?? '—',
          contractType: item.contractType ?? 'CDI',
          companyUserId: item.companyUserId ? Number(item.companyUserId) : undefined,
        }));
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger vos candidatures.';
        this.loading = false;
      },
    });
  }

  loadInterestedOffers(): void {
    this.loadingInterested = true;
    this.authService.getCandidateInterestedOffers(this.userId).subscribe({
      next: (data) => {
        this.interestedOffers = data.map((item: any) => ({
          applicationId: Number(item.applicationId ?? 0),
          jobOfferId: Number(item.jobOfferId ?? 0),
          jobTitle: item.jobTitle ?? 'Offre inconnue',
          companyName: item.companyName ?? 'Entreprise inconnue',
          companyInitial: item.companyInitial ?? '?',
          companyColor: item.companyColor ?? 'blue',
          location: item.location ?? '—',
          contractType: item.contractType ?? 'CDI',
          status: item.status ?? '',
          companyUserId: item.companyUserId ? Number(item.companyUserId) : undefined,
        }));
        this.loadingInterested = false;
      },
      error: () => { this.loadingInterested = false; }
    });
  }

  retract(item: CandidatureItem): void {
    this.retractingId = item.applicationId;
    this.authService.retractApplication(this.userId, item.jobOfferId).subscribe({
      next: () => {
        this.candidatures = this.candidatures.filter(c => c.applicationId !== item.applicationId);
        this.retractingId = null;
      },
      error: () => {
        this.retractingId = null;
      },
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      attente: 'En attente',
      encours: 'En cours',
      accepte: 'Acceptée',
      refuse: 'Refusée',
    };
    return labels[status] ?? status;
  }

  toggleChat(offerId: number): void {
    this.openChatOfferId = this.openChatOfferId === offerId ? null : offerId;
  }

  statusClass(status: string): string {
    const classes: Record<string, string> = {
      attente: 'status-attente',
      encours: 'status-encours',
      accepte: 'status-accepte',
      refuse: 'status-refuse',
    };
    return classes[status] ?? '';
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  colorVar(color: string): string {
    const map: Record<string, string> = {
      blue: 'rgba(26,95,248,0.15)',
      green: 'rgba(34,211,160,0.12)',
      amber: 'rgba(245,185,66,0.15)',
      purple: 'rgba(108,63,232,0.15)',
      red: 'rgba(255,107,107,0.12)',
    };
    return map[color] ?? 'rgba(26,95,248,0.15)';
  }

  colorText(color: string): string {
    const map: Record<string, string> = {
      blue: '#5b8ef8',
      green: '#22d3a0',
      amber: '#f5b942',
      purple: '#9b77f5',
      red: '#ff6b6b',
    };
    return map[color] ?? '#5b8ef8';
  }
}
