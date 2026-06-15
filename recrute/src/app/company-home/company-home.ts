import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RecruteApi } from '../recrute-api';
import { AuthService } from '../services/auth';
import { CompanyProfiles } from '../model/companyProfiles';

interface PublicJobOffer {
  id: number;
  title: string;
  location: string;
  contractType: string;
  description: string;
  createdAt: string;
  applicationCount: number;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  anonymous: boolean;
  reviewerName: string;
  createdAt: string;
}

interface SalaryReport {
  id: number;
  jobTitle: string;
  minSalary: number;
  maxSalary: number;
  contractType: string | null;
  createdAt: string;
}

@Component({
  selector: 'app-company-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './company-home.html',
  styleUrl: './company-home.scss',
})
export class CompanyHome implements OnInit {
  profile: CompanyProfiles | null = null;
  jobs: PublicJobOffer[] = [];
  loading = true;
  error = '';

  // Who is viewing
  myUserId = 0;
  myUserType = '';
  companyUserId = 0;

  // Reviews
  reviewsData: { avg: number | null; count: number; alreadyReviewed: boolean; reviews: Review[] } = {
    avg: null, count: 0, alreadyReviewed: false, reviews: []
  };
  ratingFilter = 0;
  showReviewForm = false;
  newRating = 5;
  newComment = '';
  newAnonymous = false;
  submittingReview = false;
  submitReviewError = '';

  // Salary
  salaries: SalaryReport[] = [];
  salaryByTitle: { title: string; contractType: string; min: number; max: number; avg: number; count: number }[] = [];
  showSalaryForm = false;
  newSalaryTitle = '';
  newSalaryMin: number | null = null;
  newSalaryMax: number | null = null;
  newSalaryContract = '';
  submittingSalary = false;
  submitSalaryError = '';

  stars = [1, 2, 3, 4, 5];

  constructor(
    private route: ActivatedRoute,
    private recruteApi: RecruteApi,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.companyUserId = Number(this.route.snapshot.params['id']);
    this.myUserId = Number(localStorage.getItem('user_id') ?? 0);
    this.myUserType = this.authService.getCurrentUserType() ?? '';

    this.recruteApi.getCompanybyId(this.companyUserId).subscribe({
      next: (p) => {
        this.profile = p;
        if (p?.id) {
          this.authService.getCompanyJobs(Number(p.id)).subscribe({
            next: (jobs) => {
              this.jobs = jobs
                .filter((j: any) => j.isActive)
                .map((j: any) => ({
                  id: j.id,
                  title: j.title ?? '',
                  location: j.location ?? '—',
                  contractType: j.contractType ?? 'CDI',
                  description: j.description ?? '',
                  createdAt: j.createdAt ?? '',
                  applicationCount: j.applicationCount ?? 0,
                }));
              this.loading = false;
            },
            error: () => { this.loading = false; },
          });
        } else {
          this.loading = false;
        }
      },
      error: () => {
        this.error = 'Profil introuvable.';
        this.loading = false;
      },
    });

    this.loadReviews();
    this.loadSalaries();
  }

  loadReviews(): void {
    this.recruteApi.getReviews(
      this.companyUserId,
      this.ratingFilter || undefined,
      this.myUserId || undefined
    ).subscribe({
      next: (data: any) => { this.reviewsData = data; },
      error: () => {},
    });
  }

  loadSalaries(): void {
    this.recruteApi.getSalaries(this.companyUserId).subscribe({
      next: (data: SalaryReport[]) => {
        this.salaries = data;
        this.buildSalaryGroups();
      },
      error: () => {},
    });
  }

  buildSalaryGroups(): void {
    const groups: Record<string, { title: string; contractType: string; mins: number[]; maxs: number[] }> = {};
    for (const s of this.salaries) {
      const key = `${s.jobTitle}__${s.contractType ?? ''}`;
      if (!groups[key]) groups[key] = { title: s.jobTitle, contractType: s.contractType ?? '', mins: [], maxs: [] };
      groups[key].mins.push(s.minSalary);
      groups[key].maxs.push(s.maxSalary);
    }
    this.salaryByTitle = Object.values(groups).map(g => ({
      title: g.title,
      contractType: g.contractType,
      min: Math.min(...g.mins),
      max: Math.max(...g.maxs),
      avg: Math.round((g.mins.reduce((a, b) => a + b, 0) + g.maxs.reduce((a, b) => a + b, 0)) / (g.mins.length + g.maxs.length) / 1000) * 1000,
      count: g.mins.length,
    }));
  }

  applyRatingFilter(r: number): void {
    this.ratingFilter = this.ratingFilter === r ? 0 : r;
    this.loadReviews();
  }

  submitReview(): void {
    if (!this.newRating || this.submittingReview) return;
    this.submittingReview = true;
    this.submitReviewError = '';
    this.recruteApi.submitReview(this.companyUserId, {
      reviewerUserId: this.myUserId,
      rating: this.newRating,
      comment: this.newComment.trim() || null,
      anonymous: this.newAnonymous,
    }).subscribe({
      next: () => {
        this.showReviewForm = false;
        this.newComment = '';
        this.newRating = 5;
        this.newAnonymous = false;
        this.submittingReview = false;
        this.loadReviews();
      },
      error: (err) => {
        this.submittingReview = false;
        this.submitReviewError = err?.status === 409
          ? 'Vous avez déjà laissé un avis pour cette entreprise.'
          : 'Erreur lors de la publication. Vérifiez votre connexion et réessayez.';
      },
    });
  }

  submitSalary(): void {
    if (!this.newSalaryTitle || this.newSalaryMin == null || this.newSalaryMax == null || this.submittingSalary) return;
    this.submittingSalary = true;
    this.submitSalaryError = '';
    this.recruteApi.submitSalary(this.companyUserId, {
      reporterUserId: this.myUserId,
      jobTitle: this.newSalaryTitle,
      minSalary: this.newSalaryMin,
      maxSalary: this.newSalaryMax,
      contractType: this.newSalaryContract || null,
    }).subscribe({
      next: () => {
        this.showSalaryForm = false;
        this.newSalaryTitle = '';
        this.newSalaryMin = null;
        this.newSalaryMax = null;
        this.newSalaryContract = '';
        this.submittingSalary = false;
        this.loadSalaries();
      },
      error: () => {
        this.submittingSalary = false;
        this.submitSalaryError = 'Erreur lors de la publication. Vérifiez votre connexion et réessayez.';
      },
    });
  }

  get isCandidate(): boolean { return this.myUserType === 'candidate'; }
  get isOwnCompany(): boolean { return this.myUserType === 'company' && this.myUserId === this.companyUserId; }
  get isLoggedIn(): boolean { return this.authService.isLoggedIn(); }

  starsArray(n: number): number[] { return Array.from({ length: Math.round(n) }, (_, i) => i); }
  emptyStarsArray(n: number): number[] { return Array.from({ length: 5 - Math.round(n) }, (_, i) => i); }

  initials(name: string): string {
    return (name ?? '').split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase();
  }

  daysAgo(iso: string): number {
    return Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
  }

  formatSalary(n: number): string {
    return n >= 1000 ? `${Math.round(n / 1000)}k€` : `${n}€`;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  }
}
