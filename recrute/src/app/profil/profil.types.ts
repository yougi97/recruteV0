import { User as ApiUser } from '../model/user';
import { CandidateProfiles } from '../model/candidateProfiles';
import { CompanyProfiles } from '../model/companyProfiles';

export type UserType = 'candidate' | 'company';

export interface User {
  id: number;
  email: string;
  user_type: UserType;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

export interface CandidateProfile {
  id: number;
  user_id: number;
  title?: string;
  location?: string;
  target_location?: string[];
  bio?: string;
  photo_url?: string;
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
  file_name?: string;
  content_type?: string;
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
  level?: 'debutant' | 'intermediaire' | 'avance' | 'expert';
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

export interface ConnectedUserContext {
  id: number;
  type: UserType;
}

export interface JobStats {
  total: number;
  active: number;
}

export const EMPTY_CANDIDATE_PROFILE: CandidateProfile = {
  id: 0,
  user_id: 0,
  title: '',
  location: '',
  target_location: [],
  bio: '',
};

export const EMPTY_COMPANY_PROFILE: CompanyProfile = {
  id: 0,
  user_id: 0,
  company_name: '',
  industry: '',
  location: '',
  description: '',
};

export function mapApiUser(apiUser: ApiUser | undefined, fallbackType: UserType = 'candidate'): User {
  return {
    id: Number(apiUser?.id ?? 0),
    email: apiUser?.email ?? '',
    user_type: (apiUser?.userType as UserType) ?? fallbackType,
    first_name: apiUser?.firstName ?? '',
    last_name: apiUser?.lastName ?? '',
    created_at: apiUser?.createdAt ? new Date(apiUser.createdAt).toISOString() : new Date().toISOString(),
  };
}

export function mapCandidateProfile(profile: CandidateProfiles, userId: number): CandidateProfile {
  return {
    id: Number(profile.id ?? 0),
    user_id: Number(profile.user?.id ?? userId),
    title: profile.title ?? '',
    location: profile.location ?? '',
    target_location: normalizeTargetLocation(profile.targetLocation),
    bio: profile.bio ?? '',
  };
}

export function mapCompanyProfile(profile: CompanyProfiles, userId: number): CompanyProfile {
  return {
    id: Number(profile.id ?? 0),
    user_id: Number(profile.user?.id ?? userId),
    company_name: profile.companyName,
    industry: normalizeIndustry(profile.industry),
    location: profile.location ?? '',
    description: profile.description ?? '',
  };
}

export function mapCv(cv: any): CV {
  return {
    id: Number(cv.id ?? 0),
    candidate_id: Number(cv.candidateProfiles?.id ?? 0),
    file_url: cv.file_url ?? '',
    file_name: cv.fileName ?? cv.file_name ?? '',
    content_type: cv.contentType ?? cv.content_type ?? '',
    is_active: Boolean(cv.isActive),
    created_at: cv.createdAt ? new Date(cv.createdAt).toISOString() : new Date().toISOString(),
  };
}

export function mapJobOffers(jobs: any[]): JobOffer[] {
  return jobs.map(job => ({
    id: Number(job.id ?? 0),
    company_id: Number(job.companyProfiles?.id ?? 0),
    title: job.title ?? '',
    description: job.description ?? '',
    location: job.location ?? '',
    contract_type: (job.contractType ?? 'CDI') as JobOffer['contract_type'],
    is_active: Boolean(job.isActive),
    created_at: job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
  }));
}

export function getConnectedUserContext(): ConnectedUserContext | null {
  const rawId = localStorage.getItem('user_id');
  const rawType = localStorage.getItem('user_type');
  if (!rawId || (rawType !== 'candidate' && rawType !== 'company')) {
    return null;
  }

  const parsedId = Number(rawId);
  if (Number.isNaN(parsedId)) {
    return null;
  }

  return { id: parsedId, type: rawType };
}

export function computeJobStats(jobOffers: JobOffer[]): JobStats {
  return {
    total: jobOffers.length,
    active: jobOffers.filter(job => job.is_active).length,
  };
}

function normalizeTargetLocation(targetLocation: unknown): string[] {
  if (Array.isArray(targetLocation)) {
    return targetLocation.map(value => String(value));
  }
  return [];
}

function normalizeIndustry(industry: unknown): string {
  if (typeof industry === 'string') {
    return industry;
  }
  return '';
}
