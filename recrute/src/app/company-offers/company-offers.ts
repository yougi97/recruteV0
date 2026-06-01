import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth';
import { JobOffer, mapJobOffers, mapCompanyProfile } from '../profil/profil.types';
import { CompanyProfiles } from '../model/companyProfiles';

interface CompanyCandidateView {
  candidateId: number;
  name: string;
  initials: string;
  color: string;
  bg: string;
  role: string;
  location: string;
  dispo: string;
  match: number;
  ai: string;
  appliedAt?: string | null;
  scoreSemantique?: number;
  scoreStructure?: number;
  scoreLlm?: number;
}

@Component({
  selector: 'app-company-offers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './company-offers.html',
  styleUrls: ['./company-offers.scss'],
})
export class CompanyOffers implements OnInit {
  offers: JobOffer[] = [];
  loading = true;
  error = '';
  companyName = '';
  companyId = 0;

  // stats calculées
  get totalOffers() { return this.offers.length; }
  get activeOffers() { return this.offers.filter(o => o.is_active).length; }
  get highMatchCount(): number {
  return this.selectedCandidates.filter(c => c.match >= 85).length;
}

  // panel candidats
  selectedOffer: JobOffer | null = null;
  panelOpen = false;
  selectedCandidates: CompanyCandidateView[] = [];
  loadingCandidates = false;
  candidatesError = '';

  // filtre offres
  activeFilter: 'all' | 'active' | 'inactive' | 'cdi' | 'stage' = 'all';

  get filteredOffers(): JobOffer[] {
    return this.offers.filter(o => {
      if (this.activeFilter === 'active') return o.is_active;
      if (this.activeFilter === 'inactive') return !o.is_active;
      if (this.activeFilter === 'cdi') return o.contract_type === 'CDI';
      if (this.activeFilter === 'stage') return o.contract_type === 'stage' || o.contract_type === 'alternance';
      return true;
    });
  }

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const userId = Number(localStorage.getItem('user_id'));
    const userType = this.authService.getCurrentUserType();
    if (userType !== 'company') {
      this.error = 'Réservé aux entreprises.';
      this.loading = false;
      return;
    }

    if (!userId) {
      this.error = 'Utilisateur non connecté.';
      this.loading = false;
      return;
    }

    // 1. Charger le profil entreprise pour récupérer son profile.id
    this.authService.getCompanybyId(userId).subscribe({
      next: (profile: CompanyProfiles) => {
        this.companyName = profile.companyName ?? '';
        this.companyId = Number(profile.id);
        const profileId = Number(profile.id);

        // 2. Charger les offres avec le profile.id
        this.authService.getCompanyJobs(profileId).subscribe({
          next: (jobs: any[]) => {
            this.offers = mapJobOffers(jobs);
            this.loading = false;
          },
          error: () => {
            this.error = 'Impossible de charger les offres.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.error = 'Impossible de charger le profil entreprise.';
        this.loading = false;
      }
    });
  }

  setFilter(f: 'all' | 'active' | 'inactive' | 'cdi' | 'stage') {
    this.activeFilter = f;
  }

  openPanel(offer: JobOffer) {
    if (!offer.is_active) return;
    this.selectedOffer = offer;
    this.panelOpen = true;
    this.loadCandidatesForOffer(offer.id);
  }

  closePanel() {
    this.panelOpen = false;
    this.selectedOffer = null;
    this.selectedCandidates = [];
    this.candidatesError = '';
  }

  getCardInitials(title: string): string {
    return title.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  getMatchClass(match: number): string {
    if (match >= 85) return 'match-high';
    if (match >= 70) return 'match-mid';
    return 'match-low';
  }

  getMatchArrow(match: number): string {
    if (match >= 85) return '↑';
    if (match >= 70) return '→';
    return '↓';
  }

  getFillClass(match: number): string {
    if (match >= 85) return 'fill-green';
    if (match >= 70) return 'fill-gold';
    return 'fill-red';
  }

  getFillColor(match: number): string {
    if (match >= 85) return 'var(--green)';
    if (match >= 70) return 'var(--gold)';
    return 'var(--red)';
  }

  getDaysOnline(createdAt: string): number {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  private loadCandidatesForOffer(jobId: number): void {
    if (!this.companyId) {
      this.candidatesError = 'Entreprise introuvable.';
      return;
    }

    this.loadingCandidates = true;
    this.candidatesError = '';
    this.selectedCandidates = [];

    this.authService.getCompanyOfferCandidates(this.companyId, jobId).subscribe({
      next: (candidates) => {
        this.selectedCandidates = candidates.map((candidate: any) => ({
          candidateId: Number(candidate.candidateId ?? 0),
          name: candidate.name ?? 'Candidat inconnu',
          initials: candidate.initials ?? '?',
          color: candidate.color ?? '#1a5ff8',
          bg: candidate.bg ?? 'rgba(26,95,248,0.15)',
          role: candidate.role ?? 'Profil candidat',
          location: candidate.location ?? 'Location inconnue',
          dispo: candidate.dispo ?? '—',
          match: Number(candidate.match ?? 0),
          ai: candidate.ai ?? 'Score IA disponible',
          appliedAt: candidate.appliedAt ?? null,
          scoreSemantique: candidate.scoreSemantique,
          scoreStructure: candidate.scoreStructure,
          scoreLlm: candidate.scoreLlm,
        }));
        this.loadingCandidates = false;
      },
      error: () => {
        this.candidatesError = 'Impossible de charger les candidats pour cette offre.';
        this.loadingCandidates = false;
      }
    });
  }
}
