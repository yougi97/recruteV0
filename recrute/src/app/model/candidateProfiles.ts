import { User } from "./user";

export interface CandidateProfiles {
    id?: number;
    user: User;
    title?: string;
    location?: string;
    targetLocation?: JSON;
    bio?: string;
}