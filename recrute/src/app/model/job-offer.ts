export type MatchLevel = 'high' | 'mid' | 'low';
export type OfferStatus = 'pending' | 'interested' | 'dismissed';
export type ContractType = 'CDI' | 'CDD' | 'Alternance' | 'Stage' | 'Freelance';
export type WorkMode = 'Présentiel' | 'Hybride' | 'Remote';

export interface JobTag {
  label: string;
  accent: boolean;
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
