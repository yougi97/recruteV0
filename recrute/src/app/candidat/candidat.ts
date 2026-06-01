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
      },
      error: () => {
        this.candidateName = this.authService.getCurrentUser() ?? '';
      },
    });

    this.loadSuggestions();
  }

  get totalCount(): number { return this.offers.length; }
  get interestedCount(): number { return this.offers.filter(o => o.status === 'interested').length; }

  onFiltersChange(filters: OfferFilters): void {
    this.filteredOffers = this.offers.filter(o => {
      if (filters.contractType && o.contractType !== filters.contractType) return false;
      if (filters.workMode && o.workMode !== filters.workMode) return false;
      if (o.matchScore < filters.minMatch) return false;
      return true;
    });
  }

  refreshSuggestions(): void {
    this.loadSuggestions(true);
  }

  onInterested(offer: JobOffer): void {
    offer.status = 'interested';
    this.jobOfferService.notifyInterest(this.candidateId, offer.id).subscribe();
    this.showToast();
  }

  onDismissed(offer: JobOffer): void {
    offer.status = 'dismissed';
    this.jobOfferService.dismissOffer(this.candidateId, offer.id).subscribe();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
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
        const normalized = this.normalizeJobOffers(data);
        this.offers = normalized;
        this.filteredOffers = normalized;
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
        aiReason: item.description ?? 'Offre d\'emploi disponible',
        status: item.status ?? 'pending',
      } as JobOffer;
    });
  }
}