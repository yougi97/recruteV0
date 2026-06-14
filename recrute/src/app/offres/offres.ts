import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { JobOfferService } from '../services/job-offer';
import { JobOffer, OfferFilters } from '../model/job-offer';
import { JobCardComponent } from '../candidat/components/job-card/job-card';
import { FiltersBarComponent } from '../candidat/components/filters-bar/filters-bar';

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
  private currentFilters: OfferFilters = { contractType: null, workMode: null, minMatch: 0 };
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private actionErrorTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private jobOfferService: JobOfferService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.candidateId = Number(localStorage.getItem('user_id'));
    this.loadOffers();
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

  private applyFilters(): void {
    const f = this.currentFilters;
    const q = this.searchQuery.toLowerCase().trim();

    let result = this.offers.filter(o => {
      if (o.status === 'dismissed') return false;
      if (f.contractType && o.contractType !== f.contractType) return false;
      if (f.workMode && o.workMode !== f.workMode) return false;
      if (o.matchScore < f.minMatch) return false;
      if (q && !`${o.title} ${o.company}`.toLowerCase().includes(q)) return false;
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
