export type MatchLevel = 'high' | 'mid' | 'low';
export type OfferStatus = 'pending' | 'interested' | 'dismissed';
export type ContractType = 'CDI' | 'CDD' | 'Alternance' | 'Stage' | 'Freelance';
export type WorkMode = 'Présentiel' | 'Hybride' | 'Remote';

export interface JobTag {
  label: string;
  accent: boolean;
}

export interface ScoreDetail {
  sem: number;
  str: number;
  llm: number;
}

export interface JobOffer {
  id: number;
  title: string;
  company: string;
  companyInitial: string;
  companyColor: 'blue' | 'green' | 'amber' | 'purple' | 'red';
  location: string;
  contractType: ContractType;
  workMode: WorkMode;
  salary: string;
  matchScore: number;
  matchLevel: MatchLevel;
  tags: JobTag[];
  aiReason: string;
  status: OfferStatus;
  description?: string;
  scoreDetail?: ScoreDetail;
  jobSkills?: { name: string }[];
  companyUserId?: number;
  companyId?: number;
  companyName?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  applicationsCount?: number;
  matchesHigh?: number;
  daysOnline?: number;
}

export interface OfferFilters {
  contractType: ContractType | null;
  workMode: WorkMode | null;
  minMatch: number;
}

export function computeMatchLevel(score: number): MatchLevel {
  if (score >= 70) return 'high';
  if (score >= 50) return 'mid';
  return 'low';
}

export function toJobOffer(item: any): JobOffer {
  let ms = item.matchScore ?? 50;
  if (typeof ms === 'number' && ms <= 1) ms = Math.round(ms * 100);
  else if (typeof ms === 'number') ms = Math.round(ms);

  return {
    id: item.id,
    title: item.title,
    company: item.company,
    companyUserId: item.companyUserId ?? undefined,
    companyInitial: item.companyInitial,
    companyColor: item.companyColor,
    location: item.location,
    contractType: item.contractType,
    workMode: item.workMode,
    salary: item.salary,
    matchScore: ms,
    matchLevel: computeMatchLevel(ms),
    tags: item.tags ?? [],
    aiReason: item.aiReason ?? '',
    description: item.description ?? '',
    scoreDetail: item.score_semantique != null ? {
      sem: item.score_semantique,
      str: item.score_structure ?? 0,
      llm: item.score_llm ?? 0,
    } : undefined,
    jobSkills: item.jobSkills ?? [],
    status: item.status ?? 'pending',
    createdAt: item.createdAt,
    applicationsCount: item.applicationCount,
  } as JobOffer;
}
