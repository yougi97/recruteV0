// profile.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DevAuth } from '../services/dev-auth';

// ─── INTERFACES (alignées sur le schéma BDD) ──────────────────────────────────

export interface User {
  id: number;
  email: string;
  user_type: 'candidate' | 'company';
  first_name?: string;
  last_name?: string;
  created_at: string;
}

export interface CandidateProfile {
  id: number;
  user_id: number;
  title?: string;
  location?: string;
  target_location?: string[];   // JSON dans la BDD
  bio?: string;
  photo_url?: string;           // non présent en BDD, à ajouter si besoin
}

export interface CompanyProfile {
  id: number;
  user_id: number;
  company_name: string;
  industry?: string;
  location?: string;
  description?: string;
}

export interface CV {
  id: number;
  candidate_id: number;
  file_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'skill' | 'domain' | 'soft_skill';
}

export interface CvCategory {
  id: number;
  cv_id: number;
  category: Category;
  confidence?: number;
  level?: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
}

export interface JobOffer {
  id: number;
  company_id: number;
  title: string;
  description?: string;
  location?: string;
  contract_type?: 'CDI' | 'CDD' | 'freelance' | 'stage' | 'alternance';
  is_active: boolean;
  created_at: string;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './profil.html',
  styleUrl: './profil.scss',
})
export class Profile implements OnInit {

  constructor(private devAuth: DevAuth) {}

  // ── Données utilisateur ─────────────────────────────────────────────────────
  user!: User;

  // ── Candidat ────────────────────────────────────────────────────────────────
  candidateProfile: CandidateProfile | null = null;
  activeCV: CV | null = null;
  cvCategories: CvCategory[] = [];

  // ── Entreprise ──────────────────────────────────────────────────────────────
  companyProfile: CompanyProfile | null = null;
  jobOffers: JobOffer[] = [];
  totalJobOffers = 0;
  activeJobOffers = 0;
  totalRatings = 0;

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
    // Si un utilisateur de démo a été sélectionné via DevAuth, l'utiliser
    const devUser = this.devAuth?.getCurrentUser?.();
    if (devUser) {
      // mappe le MockUser vers User
      this.user = {
        id: devUser.id,
        email: devUser.email,
        user_type: devUser.user_type,
        first_name: devUser.first_name,
        last_name: devUser.last_name,
        created_at: devUser.created_at,
      };

      // Remplir les données affichées selon le type
      if (this.user.user_type === 'candidate') {
        this.candidateProfile = {
          id: 1,
          user_id: this.user.id,
          title: 'Développeur Full-Stack (demo)',
          location: 'Paris, France',
          target_location: ['Paris', 'Remote'],
          bio: 'Profil de démonstration pour le candidat.',
        };

        this.activeCV = {
          id: 1,
          candidate_id: this.user.id,
          file_url: 'cv_demo.pdf',
          is_active: true,
          created_at: new Date().toISOString(),
        };

        this.cvCategories = [
          { id: 1, cv_id: 1, category: { id: 1, name: 'Angular', type: 'skill' }, level: 'avancé', confidence: 0.9 },
          { id: 2, cv_id: 1, category: { id: 2, name: 'TypeScript', type: 'skill' }, level: 'expert', confidence: 0.95 },
        ];
      } else {
        this.companyProfile = {
          id: 1,
          user_id: this.user.id,
          company_name: 'Entreprise Demo',
          industry: 'Technologie',
          location: 'Paris, France',
          description: 'Fiche entreprise (démonstration).',
        };

        this.jobOffers = [
          { id: 1, company_id: 1, title: 'Développeur Front', location: 'Remote', contract_type: 'CDI', is_active: true, created_at: new Date().toISOString() },
        ];

        this.totalRatings = 0;
        this.updateJobStats();
      }

    } else {
      // Aucun utilisateur de démo sélectionné : charger les données de démonstration
      this.loadMockData();
    }
  }

  // ─── ACTIONS CANDIDAT ──────────────────────────────────────────────────────

  onCVUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    console.log('CV sélectionné :', file.name);
    // TODO : appeler ton CVService.upload(file)
    // Puis rafraîchir this.activeCV
  }

  downloadCV(): void {
    if (!this.activeCV?.file_url) return;
    window.open(this.activeCV.file_url, '_blank');
  }

  deleteCV(): void {
    if (!this.activeCV) return;
    // TODO : appeler ton CVService.delete(this.activeCV.id)
    this.activeCV = null;
  }

  editBio(): void {
    // TODO : ouvrir modale ou champ inline
    console.log('Modifier bio');
  }

  editPersonalInfo(): void {
    // TODO : ouvrir modale d'édition
    console.log('Modifier infos personnelles');
  }

  editTargetLocations(): void {
    // TODO : ouvrir modale de sélection de villes
    console.log('Modifier localisations cibles');
  }

  // ─── ACTIONS ENTREPRISE ────────────────────────────────────────────────────

  createJobOffer(): void {
    // TODO : naviguer vers /jobs/create
    console.log('Créer une offre');
  }

  editJob(job: JobOffer): void {
    console.log('Modifier offre', job.id);
  }

  deleteJob(job: JobOffer): void {
    this.jobOffers = this.jobOffers.filter(j => j.id !== job.id);
    this.updateJobStats();
    // TODO : appeler ton JobService.delete(job.id)
  }

  editCompanyInfo(): void {
    console.log('Modifier fiche entreprise');
  }

  editDescription(): void {
    console.log('Modifier description entreprise');
  }

  // ─── UTILS ─────────────────────────────────────────────────────────────────

  private updateJobStats(): void {
    this.totalJobOffers  = this.jobOffers.length;
    this.activeJobOffers = this.jobOffers.filter(j => j.is_active).length;
  }
  
  // ─── MOCK DATA (à remplacer par des services API) ──────────────────────────
  private loadMockData(): void {
    // Données de démonstration (identiques à l'ancien bloc supprimé)
    this.user = {
      id: 1,
      email: 'jean.dupont@email.com',
      user_type: 'company',
      first_name: 'Jean',
      last_name: 'Dupont',
      created_at: '2024-09-15T10:00:00Z',
    };

    if (this.user.user_type === 'candidate') {
      this.candidateProfile = {
        id: 1,
        user_id: 1,
        title: 'Développeur Full-Stack',
        location: 'Paris, France',
        target_location: ['Paris', 'Lyon', 'Remote'],
        bio: 'Passionné par le développement web, je cherche une opportunité dans une startup innovante.',
      };

      this.activeCV = {
        id: 1,
        candidate_id: 1,
        file_url: 'cv_jean_dupont_2024.pdf',
        is_active: true,
        created_at: '2024-11-01T09:30:00Z',
      };

      this.cvCategories = [
        { id: 1, cv_id: 1, category: { id: 1, name: 'Angular', type: 'skill' }, level: 'avancé', confidence: 0.92 },
        { id: 2, cv_id: 1, category: { id: 2, name: 'TypeScript', type: 'skill' }, level: 'expert', confidence: 0.95 },
        { id: 3, cv_id: 1, category: { id: 3, name: 'Node.js', type: 'skill' }, level: 'intermédiaire', confidence: 0.78 },
        { id: 4, cv_id: 1, category: { id: 4, name: 'Travail en équipe', type: 'soft_skill' }, level: 'expert', confidence: 0.88 },
        { id: 5, cv_id: 1, category: { id: 5, name: 'Développement Web', type: 'domain' }, level: 'avancé', confidence: 0.91 },
      ];

    } else {
      this.companyProfile = {
        id: 1,
        user_id: 1,
        company_name: 'TechVision SAS',
        industry: 'Logiciels & Technologies',
        location: 'Paris, France',
        description: 'TechVision est une startup spécialisée dans l\'intelligence artificielle appliquée aux RH.',
      };

      this.jobOffers = [
        { id: 1, company_id: 1, title: 'Développeur Full-Stack', location: 'Paris', contract_type: 'CDI',  is_active: true,  created_at: '2024-11-10T00:00:00Z' },
        { id: 2, company_id: 1, title: 'UX Designer',            location: 'Remote', contract_type: 'CDD', is_active: true,  created_at: '2024-11-05T00:00:00Z' },
        { id: 3, company_id: 1, title: 'Data Scientist',          location: 'Lyon',  contract_type: 'CDI', is_active: false, created_at: '2024-10-01T00:00:00Z' },
      ];

      this.totalRatings = 47;
      this.updateJobStats();
    }
  }
  
}