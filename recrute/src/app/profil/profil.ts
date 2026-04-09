import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth';
import { CandidateProfiles } from '../model/candidateProfiles';
import { CompanyProfiles } from '../model/companyProfiles';
import { JobOfferFormCard, JobOfferCreateFormValue, JobOfferFormMode } from './job-offer-form-card/job-offer-form-card';
import { CompanyInfoFormCard, CompanyInfoFormValue } from './company-info-form-card/company-info-form-card';
import { CompanyDescriptionFormCard, CompanyDescriptionFormValue } from './company-description-form-card/company-description-form-card';
import { CandidateBioFormCard, CandidateBioFormValue } from './candidate-bio-form-card/candidate-bio-form-card';
import { CandidatePersonalInfoFormCard, CandidatePersonalInfoFormValue } from './candidate-personal-info-form-card/candidate-personal-info-form-card';
import { CandidateTargetLocationsFormCard, CandidateTargetLocationsFormValue } from './candidate-target-locations-form-card/candidate-target-locations-form-card';
import { CandidateCvUploadFormCard, CandidateCvUploadFormValue } from './candidate-cv-upload-form-card/candidate-cv-upload-form-card';
import {
  CV,
  CvCategory,
  EMPTY_CANDIDATE_PROFILE,
  EMPTY_COMPANY_PROFILE,
  JobOffer,
  User,
  computeJobStats,
  getConnectedUserContext,
  mapApiUser,
  mapCandidateProfile,
  mapCompanyProfile,
  mapCv,
  mapJobOffers,
} from './profil.types';
import { buildCandidateUpdatePayload, buildCompanyUpdatePayload } from './profil.payloads';

// ─── COMPONENT ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    JobOfferFormCard,
    CompanyInfoFormCard,
    CompanyDescriptionFormCard,
    CandidateBioFormCard,
    CandidatePersonalInfoFormCard,
    CandidateTargetLocationsFormCard,
    CandidateCvUploadFormCard,
  ],
  templateUrl: './profil.html',
  styleUrl: './profil.scss',
})
export class Profile implements OnInit {
  isLoading = true;
  errorMessage = '';

  user: User | null = null;

  candidateProfile = { ...EMPTY_CANDIDATE_PROFILE };
  activeCV: CV | null = null;
  cvCategories: CvCategory[] = [];

  companyProfile = { ...EMPTY_COMPANY_PROFILE };
  jobOffers: JobOffer[] = [];
  totalJobOffers = 0;
  activeJobOffers = 0;
  totalRatings = 0;
  showJobOfferFormCard = false;
  jobOfferFormMode: JobOfferFormMode = 'create';
  editingJobOfferId: number | null = null;
  jobOfferFormInitialValue: Partial<JobOfferCreateFormValue> | null = null;
  showCompanyInfoFormCard = false;
  showCompanyDescriptionFormCard = false;
  showCandidateBioFormCard = false;
  showCandidatePersonalInfoFormCard = false;
  showCandidateTargetLocationsFormCard = false;
  showCandidateCvUploadFormCard = false;
  selectedCandidateCvFile: File | null = null;

  constructor(
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  // ── Getters utilitaires ─────────────────────────────────────────────────────
  get initials(): string {
    const f = this.user?.first_name?.[0] ?? '';
    const l = this.user?.last_name?.[0] ?? '';
    return (f + l).toUpperCase() || '?';
  }

  get companyInitials(): string {
    return this.companyProfile?.company_name
      ?.split(' ')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase() ?? '?';
  }

  // ─── CYCLE DE VIE ──────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadProfile();
  }

  // ─── ACTIONS CANDIDAT ──────────────────────────────────────────────────────

  openCvUploadCard(): void {
    this.showCandidateCvUploadFormCard = true;
  }

  cancelCandidateCvUpload(): void {
    this.showCandidateCvUploadFormCard = false;
    this.selectedCandidateCvFile = null;
  }

  saveCandidateCvUpload(formValue: CandidateCvUploadFormValue): void {
    if (!this.user) return;
    const candidateId = this.candidateProfile.id;

    if (!candidateId) {
      this.toastr.error('Profil candidat introuvable.', 'Erreur');
      return;
    }

    this.selectedCandidateCvFile = formValue.file;

    if (!this.selectedCandidateCvFile) {
      this.toastr.warning('Sélectionne un fichier PDF avant d\'enregistrer.', 'Attention');
      return;
    }

    this.authService.createCandidateCv(candidateId, this.selectedCandidateCvFile).subscribe({
      next: () => {
        this.toastr.success('CV enregistré avec succès.', 'Succès');
        this.showCandidateCvUploadFormCard = false;
        this.selectedCandidateCvFile = null;
        this.loadCandidateCv(candidateId);
      },
      error: (err: unknown) => {
        this.toastr.error(this.getHttpErrorMessage(err, 'Impossible d\'enregistrer le CV.'), 'Erreur');
      },
    });
  }

  downloadCV(): void {
    if (!this.activeCV || !this.candidateProfile.id) return;
    const baseUrl = this.authService.getCandidateCvDownloadUrl(this.candidateProfile.id);
    window.open(`${baseUrl}?t=${Date.now()}`, '_blank');
  }

  deleteCV(): void {
    if (!this.activeCV) return;
    this.toastr.info('Suppression CV non disponible côté API pour le moment.', 'Info');
    this.activeCV = null;
  }

  editBio(): void {
    this.showCandidateBioFormCard = true;
  }

  editPersonalInfo(): void {
    this.showCandidatePersonalInfoFormCard = true;
  }

  editTargetLocations(): void {
    this.showCandidateTargetLocationsFormCard = true;
  }

  cancelCandidateBioEdit(): void {
    this.showCandidateBioFormCard = false;
  }

  cancelCandidatePersonalInfoEdit(): void {
    this.showCandidatePersonalInfoFormCard = false;
  }

  cancelCandidateTargetLocationsEdit(): void {
    this.showCandidateTargetLocationsFormCard = false;
  }

  saveCandidateBioEdit(formValue: CandidateBioFormValue): void {
    if (!this.user) return;
    this.updateCandidateProfile(
      { bio: formValue.bio },
      undefined,
      () => {
        this.showCandidateBioFormCard = false;
      }
    );
  }

  saveCandidatePersonalInfoEdit(formValue: CandidatePersonalInfoFormValue): void {
    if (!this.user) return;

    this.updateCandidateProfile(
      {
        title: formValue.title,
        location: formValue.location,
      },
      {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
      },
      () => {
        this.showCandidatePersonalInfoFormCard = false;
      }
    );
  }

  saveCandidateTargetLocationsEdit(formValue: CandidateTargetLocationsFormValue): void {
    if (!this.user) return;

    this.updateCandidateProfile(
          { targetLocation: formValue.targetLocations as unknown as JSON },
      undefined,
      () => {
        this.showCandidateTargetLocationsFormCard = false;
      }
    );
  }

  // ─── ACTIONS ENTREPRISE ────────────────────────────────────────────────────

  createJobOffer(): void {
    this.jobOfferFormMode = 'create';
    this.editingJobOfferId = null;
    this.jobOfferFormInitialValue = {
      title: '',
      description: '',
      location: '',
      contractType: 'CDI',
    };
    this.showJobOfferFormCard = true;
  }

  cancelCreateJobOffer(): void {
    this.showJobOfferFormCard = false;
    this.editingJobOfferId = null;
    this.jobOfferFormInitialValue = null;
  }

  submitCreateJobOffer(formValue: JobOfferCreateFormValue): void {
    if (this.jobOfferFormMode === 'edit' && this.editingJobOfferId !== null) {
      if (!this.user) return;

      const payload = {
        title: formValue.title,
        description: formValue.description,
        location: formValue.location,
        contractType: formValue.contractType,
      };

      this.authService.updateCompanyJob(this.companyProfile.id, this.editingJobOfferId, payload).subscribe({
        next: () => {
          this.showJobOfferFormCard = false;
          this.editingJobOfferId = null;
          this.jobOfferFormInitialValue = null;
          this.toastr.success('Offre modifiée.', 'Succès');
              this.loadCompanyJobs(this.companyProfile.id);
        },
        error: (err: unknown) => {
          this.toastr.error(this.getHttpErrorMessage(err, 'Impossible de modifier l\'offre.'), 'Erreur');
        },
      });
      return;
    }

    if (!this.user) return;

    const payload = {
      title: formValue.title,
      description: formValue.description,
      location: formValue.location,
      contractType: formValue.contractType,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    this.authService.createCompanyJob(this.companyProfile.id, payload).subscribe({
      next: () => {
        this.toastr.success('Offre créée.', 'Succès');
        this.showJobOfferFormCard = false;
        this.editingJobOfferId = null;
        this.jobOfferFormInitialValue = null;
            this.loadCompanyJobs(this.companyProfile.id);
      },
      error: (err: unknown) => {
        this.toastr.error(this.getHttpErrorMessage(err, 'Impossible de créer l\'offre.'), 'Erreur');
      },
    });
  }

  editJob(job: JobOffer): void {
    this.jobOfferFormMode = 'edit';
    this.editingJobOfferId = job.id;
    this.jobOfferFormInitialValue = {
      title: job.title,
      description: job.description ?? '',
      location: job.location ?? '',
      contractType: job.contract_type ?? 'CDI',
    };
    this.showJobOfferFormCard = true;
  }

  deleteJob(job: JobOffer): void {
    if (!this.user) return;

    const nextStatus = !job.is_active;
    this.authService.updateCompanyJobStatus(this.companyProfile.id, job.id, nextStatus).subscribe({
      next: () => {
        this.toastr.success(
          nextStatus ? 'Offre activée.' : 'Offre désactivée.',
          'Succès'
        );
            this.loadCompanyJobs(this.companyProfile.id);
      },
      error: (err: unknown) => {
        this.toastr.error(this.getHttpErrorMessage(err, 'Impossible de changer le statut de l\'offre.'), 'Erreur');
      },
    });
  }

  editCompanyInfo(): void {
    this.showCompanyInfoFormCard = true;
  }

  editDescription(): void {
    this.showCompanyDescriptionFormCard = true;
  }

  cancelCompanyInfoEdit(): void {
    this.showCompanyInfoFormCard = false;
  }

  cancelCompanyDescriptionEdit(): void {
    this.showCompanyDescriptionFormCard = false;
  }

  saveCompanyInfoEdit(formValue: CompanyInfoFormValue): void {
    if (!this.user) return;

    this.updateCompanyProfile(
      {
        companyName: formValue.companyName,
        industry: formValue.industry as unknown as JSON,
        location: formValue.location,
      },
      { email: formValue.email },
      () => {
        this.showCompanyInfoFormCard = false;
      }
    );
  }

  saveCompanyDescriptionEdit(formValue: CompanyDescriptionFormValue): void {
    if (!this.user) return;

    this.updateCompanyProfile(
      { description: formValue.description },
      undefined,
      () => {
        this.showCompanyDescriptionFormCard = false;
      }
    );
  }

  // ─── UTILS ─────────────────────────────────────────────────────────────────

  private loadProfile(): void {
    const context = getConnectedUserContext();
    if (!context) {
      this.isLoading = false;
      this.errorMessage = 'Utilisateur non connecté.';
      return;
    }

    if (context.type === 'candidate') {
      this.loadCandidateProfile(context.id);
      return;
    }

    if (context.type === 'company') {
      this.loadCompanyProfile(context.id);
      return;
    }

    this.isLoading = false;
    this.errorMessage = 'Type de profil inconnu.';
  }

  private loadCandidateProfile(userId: number): void {
    this.authService.getCandidatebyId(userId).subscribe({
      next: (profile: CandidateProfiles) => {
        this.user = mapApiUser(profile.user, 'candidate');
        this.candidateProfile = mapCandidateProfile(profile, userId);

        this.activeCV = null;
        this.cvCategories = [];
        this.loadCandidateCv(this.candidateProfile.id);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Impossible de charger le profil candidat.';
      },
    });
  }

  private loadCompanyProfile(userId: number): void {
    this.authService.getCompanybyId(userId).subscribe({
      next: (profile: CompanyProfiles) => {
        this.user = mapApiUser(profile.user, 'company');
        this.companyProfile = mapCompanyProfile(profile, userId);

        this.jobOffers = [];
        this.totalRatings = 0;
            this.loadCompanyJobs(this.companyProfile.id);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Impossible de charger le profil entreprise.';
      },
    });
  }

  private loadCandidateCv(candidateProfileId: number): void {
    this.authService.getCandidateCv(candidateProfileId).subscribe({
      next: (cv: any) => {
        if (!cv) {
          this.activeCV = null;
          return;
        }
        this.activeCV = mapCv(cv);
      },
      error: () => {
        this.activeCV = null;
      },
    });
  }

  private loadCompanyJobs(userId: number): void {
    this.authService.getCompanyJobs(userId).subscribe({
      next: (jobs: any[]) => {
        this.jobOffers = mapJobOffers(jobs);
        this.updateJobStats();
      },
      error: () => {
        this.jobOffers = [];
        this.updateJobStats();
      },
    });
  }

  private updateCandidateProfile(
    profilePatch: Partial<CandidateProfiles>,
    userPatch?: { firstName?: string; lastName?: string; email?: string },
    onSuccess?: () => void
  ): void {
    if (!this.user) return;

    const payload = buildCandidateUpdatePayload(
      this.candidateProfile,
      this.user,
      profilePatch,
      userPatch
    );

    this.authService.updateCandidateProfile(this.candidateProfile.id, payload).subscribe({
      next: () => {
        this.toastr.success('Profil candidat mis à jour.', 'Succès');
        onSuccess?.();
        this.loadCandidateProfile(this.user!.id);
      },
      error: (err: unknown) => {
        this.toastr.error(this.getHttpErrorMessage(err, 'Impossible de mettre à jour le profil candidat.'), 'Erreur');
      },
    });
  }

  private updateCompanyProfile(
    profilePatch: Partial<CompanyProfiles>,
    userPatch?: { firstName?: string; lastName?: string; email?: string },
    onSuccess?: () => void
  ): void {
    if (!this.user) return;

    const payload = buildCompanyUpdatePayload(
      this.companyProfile,
      this.user,
      profilePatch,
      userPatch
    );

    this.authService.updateCompanyProfile(this.companyProfile.id, payload).subscribe({
      next: () => {
        this.toastr.success('Profil entreprise mis à jour.', 'Succès');
        onSuccess?.();
        this.loadCompanyProfile(this.user!.id);
      },
      error: () => {
        this.toastr.error('Impossible de mettre à jour le profil entreprise.', 'Erreur');
      },
    });
  }

  private updateJobStats(): void {
    const stats = computeJobStats(this.jobOffers);
    this.totalJobOffers = stats.total;
    this.activeJobOffers = stats.active;
  }

  private getHttpErrorMessage(err: unknown, fallback: string): string {
    if (!(err instanceof HttpErrorResponse)) {
      return fallback;
    }

    if (err.status === 0) {
      return `${fallback} (backend injoignable ou CORS).`;
    }

    if (typeof err.error === 'string' && err.error.trim()) {
      return `${fallback} (${err.error})`;
    }

    if (err.error && typeof err.error === 'object' && 'message' in err.error) {
      return `${fallback} (${String((err.error as { message?: unknown }).message ?? '')})`;
    }

    return `${fallback} (HTTP ${err.status})`;
  }
}