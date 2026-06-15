import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { JobOfferService } from '../services/job-offer';
import { AuthService } from '../services/auth';
import { JobOffer, OfferFilters } from '../model/job-offer';
import { JobCardComponent } from '../candidat/components/job-card/job-card';
import { FiltersBarComponent } from '../candidat/components/filters-bar/filters-bar';
import { norm } from '../utils/normalize';

type SortBy = 'match' | 'title' | 'recent';

@Component({
  selector: 'app-offres',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, JobCardComponent, FiltersBarComponent],
  templateUrl: './offres.html',
  styleUrls: ['./offres.scss'],
})
export class OffresComponent implements OnInit {
  candidateId = 0;
  offers: JobOffer[] = [];
  filteredOffers: JobOffer[] = [];
  isLoading = true;
  errorMessage = '';
  isRefreshing = false;
  toastVisible = false;
  actionError = '';
  searchQuery = '';
  sortBy: SortBy = 'match';
  showDismissed = false;
  viewMode: 'grid' | 'list' = 'grid';
  selectedTag: string | null = null;
  selectedOffer: JobOffer | null = null;
  cvSkills: { name: string; level: string; type: string }[] = [];
  private cvId: number | null = null;
  private currentFilters: OfferFilters = { contractType: null, workMode: null, minMatch: 0 };
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private actionErrorTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private jobOfferService: JobOfferService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.candidateId = Number(localStorage.getItem('user_id'));
    this.loadOffers();
    if (this.candidateId > 0) {
      this.loadCvId();
    }
  }

  get totalCount(): number { return this.offers.filter(o => o.status !== 'dismissed').length; }
  get activeCount(): number { return this.filteredOffers.length; }
  get dismissedOffers(): JobOffer[] { return this.offers.filter(o => o.status === 'dismissed'); }

  onFiltersChange(filters: OfferFilters): void {
    this.currentFilters = filters;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  setSortBy(sort: SortBy): void {
    this.sortBy = sort;
    this.applyFilters();
  }

  setViewMode(m: 'grid' | 'list'): void {
    this.viewMode = m;
  }

  onTagClick(tag: string): void {
    this.selectedTag = norm(this.selectedTag ?? '') === norm(tag) ? null : tag;
    this.applyFilters();
  }

  clearTag(): void {
    this.selectedTag = null;
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

  pct(v: number): number {
    return Math.round((v ?? 0) * 100);
  }

  toggleDismissed(): void {
    this.showDismissed = !this.showDismissed;
  }

  refreshOffers(): void {
    this.loadOffers(true);
  }

  onInterested(offer: JobOffer): void {
    if (this.candidateId > 0) {
      this.jobOfferService.notifyInterest(this.candidateId, offer.id).subscribe({
        next: () => {
          offer.status = 'interested';
          this.showToast();
        },
        error: (err) => {
          const msg = err?.error?.message ?? err?.message ?? '';
          if (msg.toLowerCase().includes('cv')) {
            this.showActionError('Vous devez uploader un CV avant de postuler.');
          } else {
            this.showActionError('Impossible d\'enregistrer votre candidature.');
          }
        },
      });
    } else {
      offer.status = 'interested';
      this.showToast();
    }
  }

  onDismissed(offer: JobOffer): void {
    offer.status = 'dismissed';
    this.applyFilters();
    if (this.candidateId > 0) {
      this.jobOfferService.dismissOffer(this.candidateId, offer.id).subscribe();
    }
  }

  private loadCvId(): void {
    this.authService.getCandidateCv(this.candidateId).subscribe({
      next: (cv) => {
        if (cv?.id) { this.cvId = cv.id; this.loadCvSkills(cv.id); }
      },
      error: () => {}
    });
  }

  private loadCvSkills(cvId: number): void {
    const order: Record<string, number> = { expert: 4, avance: 3, intermediaire: 2, debutant: 1 };
    this.authService.getCvCategories(cvId).subscribe({
      next: (cats: any[]) => {
        this.cvSkills = cats
          .filter((c: any) => c.type !== 'soft_skill')
          .sort((a: any, b: any) => (order[b.level] ?? 0) - (order[a.level] ?? 0));
      },
      error: () => {}
    });
  }

  private applyFilters(): void {
    const f = this.currentFilters;
    const q = norm(this.searchQuery);

    let result = this.offers.filter(offer => {
      if (offer.status === 'dismissed') return false;
      if (f.contractType && norm(offer.contractType) !== norm(f.contractType)) return false;
      if (f.workMode && norm(offer.workMode) !== norm(f.workMode)) return false;
      if (offer.matchScore < f.minMatch) return false;
      if (q && !norm(`${offer.title} ${offer.company}`).includes(q)) return false;
      if (this.selectedTag && !offer.tags?.some(t => norm(t.label) === norm(this.selectedTag!))) return false;
      return true;
    });

    if (this.sortBy === 'match') {
      result = [...result].sort((a, b) => b.matchScore - a.matchScore);
    } else if (this.sortBy === 'title') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title, 'fr'));
    } else if (this.sortBy === 'recent') {
      result = [...result].sort((a, b) => b.id - a.id);
    }

    this.filteredOffers = result;
  }

  private loadOffers(isRefresh = false): void {
    if (isRefresh) {
      this.isRefreshing = true;
    } else {
      this.isLoading = true;
    }

    this.errorMessage = '';

    this.jobOfferService.getAllOffers().subscribe({
      next: (data) => {
        this.offers = this.convertToJobOffers(data);
        this.applyFilters();
        this.isLoading = false;
        this.isRefreshing = false;
      },
      error: (err) => {
        const httpStatus = typeof err?.status === 'number' ? err.status : 0;
        if (httpStatus === 404 && !isRefresh) {
          setTimeout(() => this.loadOffers(true), 500);
          return;
        }

        this.errorMessage = 'Impossible de charger les offres.';
        this.isLoading = false;
        this.isRefreshing = false;
      },
    });
  }

  private convertToJobOffers(data: any[]): JobOffer[] {
    return data.map(item => {
      let raw = item.matchScore ?? 50;
      let ms = raw;
      if (typeof ms === 'number' && ms <= 1) ms = Math.round(ms * 100);
      else if (typeof ms === 'number') ms = Math.round(ms);

      return {
        id: item.id,
        title: item.title,
        company: item.company,
        companyUserId: item.companyUserId ?? undefined,
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
        scoreDetail: item.score_semantique != null ? {
          sem: item.score_semantique,
          str: item.score_structure ?? 0,
          llm: item.score_llm ?? 0,
        } : undefined,
        jobSkills: item.jobSkills ?? [],
        status: item.status ?? 'pending',
      } as JobOffer;
    });
  }

  private computeMatchLevel(score: number): 'high' | 'mid' | 'low' {
    if (score >= 70) return 'high';
    if (score >= 50) return 'mid';
    return 'low';
  }

  private showToast(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastVisible = true;
    this.toastTimer = setTimeout(() => (this.toastVisible = false), 3200);
  }

  private showActionError(msg: string): void {
    if (this.actionErrorTimer) clearTimeout(this.actionErrorTimer);
    this.actionError = msg;
    this.actionErrorTimer = setTimeout(() => (this.actionError = ''), 4000);
  }
}
