import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RecruteApi } from '../recrute-api';
import { AuthService } from '../services/auth';
import { JobOfferService } from '../services/job-offer';
import { CompanyProfiles } from '../model/companyProfiles';
import { JobOffer, toJobOffer } from '../model/job-offer';
import { norm } from '../utils/normalize';

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
  jobs: JobOffer[] = [];
  loading = true;
  error = '';
  cvSkills: { name: string; level: string; type: string }[] = [];
  private cvId: number | null = null;

  // Who is viewing
  myUserId = 0;
  myUserType = '';
  companyUserId = 0;

  // Reviews
  reviewsData: {
    avg: number | null;
    count: number;
    alreadyReviewed: boolean;
    reviews: Review[];
    myReview?: { id: number; rating: number; comment: string | null; anonymous: boolean };
  } = { avg: null, count: 0, alreadyReviewed: false, reviews: [] };
  ratingFilter = 0;
  showReviewForm = false;
  isEditingReview = false;
  currentReviewId: number | null = null;
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

  // Job detail drawer
  selectedJob: JobOffer | null = null;
  jobInterestStatus: Record<number, 'pending' | 'interested'> = {};

  constructor(
    private route: ActivatedRoute,
    private recruteApi: RecruteApi,
    private authService: AuthService,
    private jobOfferService: JobOfferService,
  ) {}

  ngOnInit(): void {
    this.companyUserId = Number(this.route.snapshot.params['id']);
    this.myUserId = Number(localStorage.getItem('user_id') ?? 0);
    this.myUserType = this.authService.getCurrentUserType() ?? '';

    this.recruteApi.getCompanybyId(this.companyUserId).subscribe({
      next: (p) => {
        this.profile = p;
        this.jobOfferService.getAllOffers().subscribe({
          next: (offers) => {
            this.jobs = offers
              .filter((o: any) => o.companyUserId === this.companyUserId)
              .map(toJobOffer);
            this.loading = false;
          },
          error: () => { this.loading = false; },
        });
      },
      error: () => {
        this.error = 'Profil introuvable.';
        this.loading = false;
      },
    });

    if (this.myUserId > 0) {
      this.loadCvId();
    }

    this.loadReviews();
    this.loadSalaries();
  }

  private loadCvId(): void {
    this.authService.getCandidateCv(this.myUserId).subscribe({
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

  pct(v: number): number {
    return Math.round((v ?? 0) * 100);
  }

  isJobSkillInCv(skillName: string): boolean {
    if (!skillName || !this.cvSkills.length) return false;
    const nl = norm(skillName);
    return this.cvSkills.some(s => norm(s.name) === nl);
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

  startEditReview(): void {
    const mr = this.reviewsData.myReview;
    if (!mr) return;
    this.currentReviewId = mr.id;
    this.newRating = mr.rating;
    this.newComment = mr.comment ?? '';
    this.newAnonymous = mr.anonymous;
    this.isEditingReview = true;
    this.showReviewForm = true;
    this.submitReviewError = '';
  }

  submitReview(): void {
    if (!this.newRating || this.submittingReview) return;
    this.submittingReview = true;
    this.submitReviewError = '';

    const payload = {
      reviewerUserId: this.myUserId,
      rating: this.newRating,
      comment: this.newComment.trim() || null,
      anonymous: this.newAnonymous,
    };

    const request$ = this.isEditingReview && this.currentReviewId
      ? this.recruteApi.updateReview(this.currentReviewId, payload)
      : this.recruteApi.submitReview(this.companyUserId, payload);

    request$.subscribe({
      next: () => {
        this.showReviewForm = false;
        this.isEditingReview = false;
        this.currentReviewId = null;
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

  markInterested(job: JobOffer): void {
    if (this.jobInterestStatus[job.id] === 'interested' || !this.myUserId) return;
    this.jobInterestStatus[job.id] = 'interested';
    this.jobOfferService.notifyInterest(this.myUserId, job.id).subscribe();
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
