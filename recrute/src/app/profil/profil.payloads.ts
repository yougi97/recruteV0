import { CandidateProfiles } from '../model/candidateProfiles';
import { CompanyProfiles } from '../model/companyProfiles';
import { User as ApiUser } from '../model/user';
import { CandidateProfile, CompanyProfile, User } from './profil.types';

type UserPatch = { firstName?: string; lastName?: string; email?: string };

export function buildCandidateUpdatePayload(
  profile: CandidateProfile,
  user: User,
  password: string,
  profilePatch: Partial<CandidateProfiles>,
  userPatch?: UserPatch
): CandidateProfiles {
  const apiUser: ApiUser = {
    id: user.id,
    email: userPatch?.email ?? user.email,
    password,
    userType: 'candidate',
    firstName: userPatch?.firstName ?? user.first_name,
    lastName: userPatch?.lastName ?? user.last_name,
    createdAt: new Date(user.created_at),
  };

  return {
    id: profile.id,
    user: apiUser,
    title: profilePatch.title ?? profile.title,
    location: profilePatch.location ?? profile.location,
    targetLocation: profilePatch.targetLocation ?? (profile.target_location as unknown as JSON),
    bio: profilePatch.bio ?? profile.bio,
  };
}

export function buildCompanyUpdatePayload(
  profile: CompanyProfile,
  user: User,
  password: string,
  profilePatch: Partial<CompanyProfiles>,
  userPatch?: UserPatch
): CompanyProfiles {
  const apiUser: ApiUser = {
    id: user.id,
    email: userPatch?.email ?? user.email,
    password,
    userType: 'company',
    firstName: userPatch?.firstName ?? user.first_name,
    lastName: userPatch?.lastName ?? user.last_name,
    createdAt: new Date(user.created_at),
  };

  return {
    id: profile.id,
    user: apiUser,
    companyName: profilePatch.companyName ?? profile.company_name,
    industry: profilePatch.industry ?? (profile.industry as unknown as JSON),
    location: profilePatch.location ?? profile.location,
    description: profilePatch.description ?? profile.description,
  };
}
