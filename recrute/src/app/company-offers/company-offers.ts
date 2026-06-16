import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../services/auth';
import { JobOffer, mapJobOffers, mapCompanyProfile } from '../profil/profil.types';
import { CompanyProfiles } from '../model/companyProfiles';
import { ChatComponent } from '../components/chat/chat';

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
  applicationStatus?: string | null;
  applicationId?: number | null;
  userId?: number | null;
  companyInterested?: boolean;
  applied?: boolean;
  scoreSemantique?: number;
  scoreStructure?: number;
  scoreLlm?: number;
  cvSkills?: { name: string; level: string | null; type: string | null }[];
}

@Component({
  selector: 'app-company-offers',
  standalone: true,
  imports: [CommonModule, RouterModule, ChatComponent],
  templateUrl: './company-offers.html',
  styleUrls: ['./company-offers.scss'],
})
export class CompanyOffers implements OnInit, OnDestroy {
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
  panelTab: 'top' | 'applications' = 'top';
  selectedCandidates: CompanyCandidateView[] = [];
  loadingCandidates = false;
  candidatesError = '';
  topCandidates: CompanyCandidateView[] = [];
  loadingTop = false;
  topError = '';
  refreshingScores = false;
  computingScores = false;

  // CV viewer modal
  cvViewUrl: SafeResourceUrl | null = null;

  // Offer skill matching
  private offerSearchText = '';

  // chat
  myCompanyUserId = 0;
  openChatCandidateUserId: number | null = null;

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

  constructor(private authService: AuthService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    const userId = Number(localStorage.getItem('user_id'));
    this.myCompanyUserId = userId;
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
    this.panelTab = 'top';
    this.offerSearchText = ((offer.title ?? '') + ' ' + (offer.description ?? '')).toLowerCase();
    this.computeAndLoadCandidates(offer.id);
  }

  closePanel() {
    this.panelOpen = false;
    this.selectedOffer = null;
    this.selectedCandidates = [];
    this.candidatesError = '';
    this.topCandidates = [];
    this.topError = '';
    this.openChatCandidateUserId = null;
  }

  toggleCandidateChat(candidateUserId: number): void {
    this.openChatCandidateUserId = this.openChatCandidateUserId === candidateUserId ? null : candidateUserId;
  }

  getStatusLabel(status: string | null | undefined): string {
    switch (status) {
      case 'attente':  return 'En attente';
      case 'encours':  return 'En cours';
      case 'accepte':  return 'Accepté';
      case 'refuse':   return 'Refusé';
      default:         return '—';
    }
  }

  getStatusClass(status: string | null | undefined): string {
    switch (status) {
      case 'attente':  return 'status-attente';
      case 'encours':  return 'status-encours';
      case 'accepte':  return 'status-accepte';
      case 'refuse':   return 'status-refuse';
      default:         return '';
    }
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

  refreshTopScores(): void {
    if (!this.selectedOffer || this.refreshingScores) return;
    const jobId = this.selectedOffer.id;
    this.refreshingScores = true;
    this.authService.computeAllCandidateScores(this.companyId, jobId).subscribe({
      next: () => {
        this.loadTopCandidates(jobId);
        this.loadCandidatesForOffer(jobId);
        this.refreshingScores = false;
      },
      error: () => {
        this.topError = 'Erreur lors du calcul des scores.';
        this.refreshingScores = false;
      }
    });
  }

  private cvObjectUrl: string | null = null;

  viewCv(c: CompanyCandidateView): void {
    if (!c.userId) return;
    this.authService.getCandidateCvViewBlob(c.userId).subscribe({
      next: (blob) => {
        this.revokeCvObjectUrl();
        this.cvObjectUrl = URL.createObjectURL(blob);
        this.cvViewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.cvObjectUrl);
      },
      error: () => { this.cvViewUrl = null; }
    });
  }

  closeCvModal(): void {
    this.cvViewUrl = null;
    this.revokeCvObjectUrl();
  }

  private revokeCvObjectUrl(): void {
    if (this.cvObjectUrl) {
      URL.revokeObjectURL(this.cvObjectUrl);
      this.cvObjectUrl = null;
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.closeCvModal();
  }

  ngOnDestroy(): void {
    this.cvViewUrl = null;
    this.revokeCvObjectUrl();
  }

  isSkillInOffer(skillName: string): boolean {
    return !!skillName && this.offerSearchText.includes(skillName.toLowerCase());
  }

  countMatchingSkills(c: CompanyCandidateView): number {
    return (c.cvSkills ?? []).filter(s => this.isSkillInOffer(s.name)).length;
  }

  reviewApp(c: CompanyCandidateView, status: string): void {
    if (!c.applicationId || !this.selectedOffer) return;
    this.authService.reviewApplication(this.companyId, this.selectedOffer.id, c.applicationId, status).subscribe({
      next: () => { c.applicationStatus = status; }
    });
  }

  markInterest(c: CompanyCandidateView): void {
    if (!c.candidateId || !this.selectedOffer) return;
    this.authService.markCompanyInterest(this.companyId, this.selectedOffer.id, c.candidateId).subscribe({
      next: () => { c.companyInterested = true; }
    });
  }

  private mapCandidate(c: any): CompanyCandidateView {
    return {
      candidateId: Number(c.candidateId ?? 0),
      name: c.name ?? 'Candidat inconnu',
      initials: c.initials ?? '?',
      color: c.color ?? '#1a5ff8',
      bg: c.bg ?? 'rgba(26,95,248,0.15)',
      role: c.role ?? 'Profil candidat',
      location: c.location ?? 'Location inconnue',
      dispo: c.dispo ?? '—',
      match: Number(c.match ?? 0),
      ai: c.ai ?? 'Score IA disponible',
      appliedAt: c.appliedAt ?? null,
      applicationStatus: c.applicationStatus ?? null,
      applicationId: c.applicationId ?? null,
      userId: c.userId ?? null,
      companyInterested: c.companyInterested ?? false,
      applied: c.applied ?? false,
      scoreSemantique: c.scoreSemantique,
      scoreStructure: c.scoreStructure,
      scoreLlm: c.scoreLlm,
      cvSkills: c.cvSkills ?? [],
    };
  }

  private loadCandidatesForOffer(jobId: number): void {
    this.loadingCandidates = true;
    this.candidatesError = '';
    this.selectedCandidates = [];

    this.authService.getCompanyOfferCandidates(this.companyId, jobId).subscribe({
      next: (candidates) => {
        this.selectedCandidates = candidates.map((c: any) => this.mapCandidate(c));
        this.loadingCandidates = false;
      },
      error: () => {
        this.candidatesError = 'Impossible de charger les candidatures.';
        this.loadingCandidates = false;
      }
    });
  }

  private loadTopCandidates(jobId: number): void {
    this.loadingTop = true;
    this.topError = '';
    this.topCandidates = [];

    this.authService.getTopCandidates(this.companyId, jobId).subscribe({
      next: (candidates) => {
        this.topCandidates = candidates.map((c: any) => this.mapCandidate(c));
        this.loadingTop = false;
      },
      error: () => {
        this.topError = 'Impossible de charger le classement IA.';
        this.loadingTop = false;
      }
    });
  }

  private computeAndLoadCandidates(jobId: number): void {
    if (!this.companyId) {
      this.candidatesError = 'Entreprise introuvable.';
      this.topError = 'Entreprise introuvable.';
      return;
    }

    this.computingScores = true;
    this.authService.computeCompanyOfferMissingScores(this.companyId, jobId).subscribe({
      next: () => {
        this.computingScores = false;
        this.loadTopCandidates(jobId);
        this.loadCandidatesForOffer(jobId);
      },
      error: () => {
        this.computingScores = false;
        this.loadTopCandidates(jobId);
        this.loadCandidatesForOffer(jobId);
      },
    });
  }
}
