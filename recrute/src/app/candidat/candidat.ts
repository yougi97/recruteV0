import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { JobOfferService } from '../services/job-offer';
import { JobOffer, OfferFilters } from '../model/job-offer';
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
  offers: JobOffer[] = [];
  filteredOffers: JobOffer[] = [];
  isLoading = true;
  toastVisible = false;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private authService: AuthService,
    private jobOfferService: JobOfferService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.candidateName = this.authService.getCurrentUser() ?? '';
    this.candidateId = Number(localStorage.getItem('user_id'));

  this.jobOfferService.getSuggestions(this.candidateId).subscribe({
      next: (data) => {
        this.offers = data;
        this.filteredOffers = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
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
}