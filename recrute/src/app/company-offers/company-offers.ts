import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth';
import { JobOffer, mapJobOffers, mapCompanyProfile } from '../profil/profil.types';
import { CompanyProfiles } from '../model/companyProfiles';

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

  // stats calculées
  get totalOffers() { return this.offers.length; }
  get activeOffers() { return this.offers.filter(o => o.is_active).length; }
  get highMatchCount(): number {
  return this.mockCandidates.filter(c => c.match >= 85).length;
}

  // panel candidats
  selectedOffer: JobOffer | null = null;
  panelOpen = false;

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

  // mock candidats (IA pas encore implémentée)
  mockCandidates = [
    { name: 'Julien Marchand', initials: 'JM', color: '#1a5ff8', bg: 'rgba(26,95,248,0.15)', role: 'Développeur React · 4 ans exp.', location: 'Paris', dispo: 'Immédiat', match: 94, ai: 'Maîtrise technique très proche du profil recherché. Disponibilité immédiate et préférence de travail hybride alignée avec le poste.' },
    { name: 'Camille Duval', initials: 'CD', color: '#22d3a0', bg: 'rgba(34,211,160,0.12)', role: 'Développeuse Senior · 6 ans exp.', location: 'Paris', dispo: '1 mois', match: 88, ai: 'Profil senior avec un stack technique très complémentaire. Légère surqualification compensée par sa volonté de progression.' },
    { name: 'Sofiane Belaid', initials: 'SB', color: '#9b77f5', bg: 'rgba(108,63,232,0.15)', role: 'Développeur Web · 2 ans exp.', location: 'Banlieue Paris', dispo: 'Immédiat', match: 81, ai: 'Solide base technique, quelques compétences en cours d\'acquisition. Nécessite un accompagnement les premières semaines.' },
    { name: 'Emma Roux', initials: 'ER', color: '#f5b942', bg: 'rgba(245,185,66,0.15)', role: 'Dev Full-Stack · 3 ans exp.', location: 'Remote', dispo: '2 semaines', match: 74, ai: 'Profil orienté full-stack, la localisation et le mode de travail restent à clarifier.' },
    { name: 'Antoine Klein', initials: 'AK', color: '#ff6b6b', bg: 'rgba(255,107,107,0.12)', role: 'Développeur Freelance · 5 ans exp.', location: 'Lyon', dispo: '3 mois', match: 61, ai: 'Expérience solide mais en freelance exclusivement. Transition CDI et localisation nécessitent clarification.' },
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const userId = Number(localStorage.getItem('user_id'));
    if (!userId) {
      this.error = 'Utilisateur non connecté.';
      this.loading = false;
      return;
    }

    // 1. Charger le profil entreprise pour récupérer son profile.id
    this.authService.getCompanybyId(userId).subscribe({
      next: (profile: CompanyProfiles) => {
        this.companyName = profile.companyName ?? '';
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
  }

  closePanel() {
    this.panelOpen = false;
    this.selectedOffer = null;
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
}
