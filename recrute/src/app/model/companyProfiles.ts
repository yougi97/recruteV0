import { User } from "./user";

export interface CompanyProfiles {
    id?: number;
    user: User;
    companyName: string;
    industry?: JSON;
    location?: string;
    description?: string;
}