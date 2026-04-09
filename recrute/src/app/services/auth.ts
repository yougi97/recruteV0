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

  getCompanyJobs(companyId: number): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.url}/users/company/${companyId}/jobs`);
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