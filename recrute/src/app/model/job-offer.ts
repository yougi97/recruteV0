export interface JobOffer {
  id: number;
  title: string;
  description: string;
  location: string;
  contractType: string;
  companyId: number;
  companyName: string;
  isActive: boolean;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  applicationsCount?: number;
  matchesHigh?: number;
  daysOnline?: number;
}
