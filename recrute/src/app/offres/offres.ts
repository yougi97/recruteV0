import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { JobOfferService } from '../services/job-offer';
import { JobOffer, OfferFilters } from '../model/job-offer';
import { JobCardComponent } from '../candidat/components/job-card/job-card';
import { FiltersBarComponent } from '../candidat/components/filters-bar/filters-bar';

@Component({
  selector: 'app-offres',
  standalone: true,
  imports: [CommonModule, RouterModule, JobCardComponent, FiltersBarComponent],
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

  get totalCount(): number { return this.offers.length; }

  onFiltersChange(filters: OfferFilters): void {
    this.filteredOffers = this.offers.filter(o => {
      if (filters.contractType && o.contractType !== filters.contractType) return false;
      if (filters.workMode && o.workMode !== filters.workMode) return false;
      if (o.matchScore < filters.minMatch) return false;
      return true;
    });
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
    if (this.candidateId > 0) {
      this.jobOfferService.dismissOffer(this.candidateId, offer.id).subscribe();
    }
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
        this.filteredOffers = this.offers;
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
      // Normalize scores coming from backend: if in [0,1] treat as ratio and convert to percent
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
