import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
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

@Component({
  selector: 'app-company-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './company-home.html',
  styleUrl: './company-home.scss',
})
export class CompanyHome implements OnInit {
  profile: CompanyProfiles | null = null;
  jobs: PublicJobOffer[] = [];
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private recruteApi: RecruteApi,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const userId = Number(this.route.snapshot.params['id']);
    this.recruteApi.getCompanybyId(userId).subscribe({
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
  }

  initials(name: string): string {
    return (name ?? '').split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase();
  }

  daysAgo(iso: string): number {
    return Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
  }
}
