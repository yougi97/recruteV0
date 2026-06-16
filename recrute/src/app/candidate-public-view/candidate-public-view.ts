import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RecruteApi } from '../recrute-api';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-candidate-public-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './candidate-public-view.html',
  styleUrl: './candidate-public-view.scss',
})
export class CandidatePublicView implements OnInit {
  candidateUserId = 0;
  profile: any = null;
  cvSkills: { name: string; level: string | null; type: string | null }[] = [];
  loading = true;
  loadingCv = true;
  error = '';

  get targetLocations(): string[] {
    const raw = this.profile?.targetLocation;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as string[];
    try { return JSON.parse(raw as string) as string[]; } catch { return []; }
  }

  constructor(
    private route: ActivatedRoute,
    private recruteApi: RecruteApi,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.candidateUserId = Number(this.route.snapshot.params['id']);

    this.recruteApi.getCandidatebyId(this.candidateUserId).subscribe({
      next: (p) => {
        this.profile = p;
        this.loading = false;
      },
      error: () => {
        this.error = 'Profil introuvable.';
        this.loading = false;
      },
    });

    this.authService.getCandidateCv(this.candidateUserId).subscribe({
      next: (cv) => {
        if (cv?.id) {
          this.authService.getCvCategories(cv.id).subscribe({
            next: (cats) => {
              this.cvSkills = (cats ?? [])
                .filter((c: any) => c.name)
                .map((c: any) => ({
                  name: c.name,
                  level: c.level ? (c.level as string).toLowerCase() : null,
                  type: c.type ? (c.type as string).toLowerCase() : null,
                }));
              this.loadingCv = false;
            },
            error: () => { this.loadingCv = false; },
          });
        } else {
          this.loadingCv = false;
        }
      },
      error: () => { this.loadingCv = false; },
    });
  }

  get fullName(): string {
    if (!this.profile?.user) return '';
    return `${this.profile.user.firstName ?? ''} ${this.profile.user.lastName ?? ''}`.trim();
  }

  initials(name: string): string {
    return (name ?? '').split(' ').slice(0, 2).map((w: string) => w[0] ?? '').join('').toUpperCase();
  }
}
