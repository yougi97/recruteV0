import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { JobOfferService } from '../services/job-offer';
import { JobOffer, OfferFilters } from '../model/job-offer';
import { CandidateProfiles } from '../model/candidateProfiles';
import { JobCardComponent } from './components/job-card/job-card';
import { FiltersBarComponent } from './components/filters-bar/filters-bar';
import { PageHeaderComponent } from './components/page-header/page-header';
import { norm } from '../utils/normalize';

@Component({
  selector: 'app-candidat',
  standalone: true,
  imports: [CommonModule, RouterModule, JobCardComponent, FiltersBarComponent, PageHeaderComponent],
  templateUrl: './candidat.html',
  styleUrls: ['./candidat.scss'],
})
export class CandidatComponent implements OnInit {
  candidateName = '';
  candidateId: number = 0;
  candidateProfile: CandidateProfiles | null = null;
  offers: JobOffer[] = [];
  filteredOffers: JobOffer[] = [];
  isLoading = true;
  errorMessage = '';
  toastVisible = false;
  isRefreshing = false;
  computingScores = false;
  showDismissed = false;
  hasCv: boolean | null = null;
  cvSkills: { name: string; level: string; type: string }[] = [];
  showCvInsights = false;
  selectedOffer: JobOffer | null = null;
  protected cvId: number | null = null;
  private currentFilters: OfferFilters = { contractType: null, workMode: null, minMatch: 0 };
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private authService: AuthService,
    private jobOfferService: JobOfferService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.candidateId = Number(localStorage.getItem('user_id'));

    if (!this.candidateId) {
      this.errorMessage = 'Profil candidat introuvable.';
      this.isLoading = false;
      return;
    }

    this.authService.getCandidatebyId(this.candidateId).subscribe({
      next: (profile) => {
        this.candidateProfile = profile;
        const fallbackName = this.authService.getCurrentUser() ?? '';
        const displayName = `${profile.user?.firstName ?? ''} ${profile.user?.lastName ?? ''}`.trim();
        this.candidateName = displayName || fallbackName;

        if (profile?.id) {
          this.authService.getCandidateCv(profile.id).subscribe({
            next: (cv) => {
              this.hasCv = !!cv?.id;
              if (cv?.id) { this.cvId = cv.id; this.loadCvSkills(cv.id); }
            },
            error: () => { this.hasCv = false; }
          });
        }
      },
      error: () => {
        this.candidateName = this.authService.getCurrentUser() ?? '';
      },
    });

    this.loadSuggestions();
  }

  get totalCount(): number { return this.offers.filter(o => o.status !== 'dismissed').length; }
  get interestedCount(): number { return this.offers.filter(o => o.status === 'interested').length; }
  get dismissedOffers(): JobOffer[] { return this.offers.filter(o => o.status === 'dismissed'); }

  toggleDismissed(): void {
    this.showDismissed = !this.showDismissed;
  }

  onFiltersChange(filters: OfferFilters): void {
    this.currentFilters = filters;
    this.applyFilters();
  }

  openDetail(offer: JobOffer): void {
    this.selectedOffer = offer;
    document.body.style.overflow = 'hidden';
  }

  closeDetail(): void {
    this.selectedOffer = null;
    document.body.style.overflow = '';
  }

  toggleCvInsights(): void {
    this.showCvInsights = !this.showCvInsights;
  }

  private loadCvSkills(cvId: number): void {
    const order: Record<string, number> = { expert: 4, avance: 3, intermediaire: 2, debutant: 1 };
    this.authService.getCvCategories(cvId).subscribe({
      next: (cats: any[]) => {
        this.cvSkills = cats
          .filter(c => c.type !== 'soft_skill')
          .sort((a, b) => (order[b.level] ?? 0) - (order[a.level] ?? 0));
      },
      error: () => {}
    });
  }

  pct(v: number): number {
    return Math.round((v ?? 0) * 100);
  }

  refreshSuggestions(): void {
    const profileId = this.candidateProfile?.id;
    if (!profileId) { this.loadSuggestions(true); return; }

    this.computingScores = true;
    this.authService.getCandidateCv(profileId).subscribe({
      next: (cv) => {
        const cvId = cv?.id;
        if (!cvId) { this.computingScores = false; this.loadSuggestions(true); return; }
        this.authService.scoreCandidateCv(cvId).subscribe({
          next: () => { this.computingScores = false; this.loadSuggestions(true); },
          error: () => { this.computingScores = false; this.loadSuggestions(true); },
        });
      },
      error: () => { this.computingScores = false; this.loadSuggestions(true); },
    });
  }

  onInterested(offer: JobOffer): void {
    offer.status = 'interested';
    this.applyFilters();
    this.jobOfferService.notifyInterest(this.candidateId, offer.id).subscribe();
    this.showToast();
  }

  onDismissed(offer: JobOffer): void {
    offer.status = 'dismissed';
    this.applyFilters();
    this.jobOfferService.dismissOffer(this.candidateId, offer.id).subscribe();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private applyFilters(): void {
    const f = this.currentFilters;
    this.filteredOffers = this.offers.filter(o => {
      if (o.status === 'dismissed') return false;
      if (f.contractType && norm(o.contractType) !== norm(f.contractType)) return false;
      if (f.workMode && norm(o.workMode) !== norm(f.workMode)) return false;
      if (o.matchScore < f.minMatch) return false;
      return true;
    });
  }

  private showToast(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastVisible = true;
    this.toastTimer = setTimeout(() => (this.toastVisible = false), 3200);
  }

  private computeMatchLevel(score: number): 'high' | 'mid' | 'low' {
    if (score >= 70) return 'high';
    if (score >= 50) return 'mid';
    return 'low';
  }

  private loadSuggestions(isRefresh = false): void {
    if (isRefresh) {
      this.isRefreshing = true;
    } else {
      this.isLoading = true;
    }

    this.errorMessage = '';

    this.jobOfferService.getSuggestions(this.candidateId).subscribe({
      next: (data) => {
        this.offers = this.normalizeJobOffers(data);
        this.applyFilters();
        this.isLoading = false;
        this.isRefreshing = false;
      },
      error: (err) => {
        const httpStatus = typeof err?.status === 'number' ? err.status : 0;
        if (httpStatus === 404 && !isRefresh) {
          setTimeout(() => this.loadSuggestions(true), 500);
          return;
        }

        this.errorMessage = 'Impossible de charger les suggestions IA.';
        this.isLoading = false;
        this.isRefreshing = false;
      },
    });
  }

  private normalizeJobOffers(data: any[]): JobOffer[] {
    return data.map(item => {
      let raw = item.matchScore ?? 50;
      let ms = raw;
      if (typeof ms === 'number' && ms <= 1) ms = Math.round(ms * 100);
      else if (typeof ms === 'number') ms = Math.round(ms);

      return {
        id: item.id,
        title: item.title,
        company: item.company,
        companyInitial: item.companyInitial,
        companyColor: item.companyColor,
        location: item.location,
        contractType: item.contractType as any,
        workMode: item.workMode as any,
        salary: item.salary,
        matchScore: ms,
        matchLevel: this.computeMatchLevel(ms),
        tags: item.tags ?? [],
        aiReason: item.aiReason ?? '',
        description: item.description ?? '',
        jobSkills: item.jobSkills ?? [],
        status: item.status ?? 'pending',
      } as JobOffer;
    });
  }
}
