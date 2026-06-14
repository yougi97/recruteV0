import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CandidateProfiles } from '../model/candidateProfiles';
import { CompanyProfiles } from '../model/companyProfiles';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly httpClient = inject(HttpClient)
  private readonly url = "http://localhost:8080"
  private readonly pythonUrl = "http://localhost:5001"

  getCandidatebyId(id: number): Observable<CandidateProfiles> {
    return this.httpClient.get<CandidateProfiles>(`${this.url}/users/candidate/${id}`);
  }

  getCompanybyId(id: number): Observable<CompanyProfiles> {
    return this.httpClient.get<CompanyProfiles>(`${this.url}/users/company/${id}`);
  }

  updateCandidateProfile(id: number, candidate: CandidateProfiles): Observable<CandidateProfiles> {
    return this.httpClient.put<CandidateProfiles>(`${this.url}/users/candidate/${id}`, candidate);
  }

  updateCompanyProfile(id: number, company: CompanyProfiles): Observable<CompanyProfiles> {
    return this.httpClient.put<CompanyProfiles>(`${this.url}/users/company/${id}`, company);
  }

  getCandidateCv(candidateId: number): Observable<any> {
    return this.httpClient.get<any>(`${this.url}/users/candidate/${candidateId}/cv`);
  }

  createCandidateCv(candidateId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.httpClient.post<any>(`${this.url}/users/candidate/${candidateId}`, formData);
  }

  getCandidateCvDownloadUrl(candidateId: number): string {
    return `${this.url}/users/candidate/${candidateId}/cv/download`;
  }

  getCandidateCvViewUrl(candidateId: number): string {
    return `${this.url}/users/candidate/${candidateId}/cv/view`;
  }

  computeCandidateCv(cvId: number): Observable<any> {
    const formData = new FormData();
    formData.append('cv_id', cvId.toString());
    return this.httpClient.post<any>(`${this.pythonUrl}/parse-cv`, formData);
  }

  scoreCandidateCv(cvId: number): Observable<any> {
    return this.httpClient.post<any>(`${this.pythonUrl}/score-cv`, { cv_id: cvId });
  }

  getCvCategories(cvId: number): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.url}/api/internal/cvs/${cvId}/categories`);
  }

  getCompanyJobs(companyId: number): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.url}/users/company/${companyId}/jobs`);
  }

  getCompanyOfferCandidates(companyId: number, jobId: number): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.url}/users/company/${companyId}/jobs/${jobId}/candidates`);
  }

  getTopCandidates(companyId: number, jobId: number): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.url}/users/company/${companyId}/jobs/${jobId}/top-candidates`);
  }

  computeCompanyOfferMissingScores(companyId: number, jobId: number): Observable<any> {
    return this.httpClient.post<any>(`${this.url}/users/company/${companyId}/jobs/${jobId}/compute-missing-scores`, {});
  }

  computeAllCandidateScores(companyId: number, jobId: number): Observable<any> {
    return this.httpClient.post<any>(`${this.url}/users/company/${companyId}/jobs/${jobId}/compute-all-scores`, {});
  }

  createCompanyJob(companyId: number, job: any): Observable<any> {
    return this.httpClient.post<any>(`${this.url}/users/company/${companyId}/jobs`, job);
  }

  updateCompanyJob(companyId: number, jobId: number, job: any): Observable<any> {
    return this.httpClient.put<any>(`${this.url}/users/company/${companyId}/jobs/${jobId}`, job);
  }

  updateCompanyJobStatus(companyId: number, jobId: number, isActive: boolean): Observable<any> {
    return this.httpClient.patch<any>(`${this.url}/users/company/${companyId}/jobs/${jobId}/status`, { isActive });
  }

  getCandidateApplications(userId: number): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.url}/users/candidate/${userId}/applications`);
  }

  getCandidateInterestedOffers(userId: number): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.url}/users/candidate/${userId}/interested-offers`);
  }

  retractApplication(userId: number, offerId: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.url}/users/candidate/${userId}/offers/${offerId}/application`);
  }

  reviewApplication(companyId: number, jobId: number, applicationId: number, status: string): Observable<void> {
    return this.httpClient.patch<void>(
      `${this.url}/users/company/${companyId}/jobs/${jobId}/applications/${applicationId}/review`,
      { status }
    );
  }

  markCompanyInterest(companyId: number, jobId: number, candidateId: number): Observable<void> {
    return this.httpClient.post<void>(
      `${this.url}/users/company/${companyId}/jobs/${jobId}/candidates/${candidateId}/interest`,
      {}
    );
  }

  createCandidate(candidate: CandidateProfiles): Observable<CandidateProfiles> {
    return this.httpClient.post<CandidateProfiles>(`${this.url}/users/candidate`, candidate);
  }

  createCompany(company: CompanyProfiles): Observable<CompanyProfiles> {
    return this.httpClient.post<CompanyProfiles>(`${this.url}/users/company`, company);
  }

  login(email: string, password: string): Observable<any> {
    return this.httpClient.post<any>(`${this.url}/users/login`, { email, password }).pipe(
      tap(response => {
        localStorage.setItem('user_email', email);
        localStorage.setItem('user_type', response.userType);
        localStorage.setItem('user_id', response.id);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_type');
    localStorage.removeItem('user_id');
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('user_email') !== null;
  }

  getCurrentUser(): string | null {
    return localStorage.getItem('user_email');
  }

  getCurrentUserType(): string | null {
    return localStorage.getItem('user_type');
  }
}