import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { CandidateProfiles } from './model/candidateProfiles';
import { CompanyProfiles } from './model/companyProfiles';

@Injectable({
  providedIn: 'root',
})
export class RecruteApi {
  private readonly httpClient = inject(HttpClient)
  private readonly url = "https://localhost"

  getCandidatebyId(id: number): Observable<CandidateProfiles> {
    return this.httpClient.get<CandidateProfiles>(`${this.url}/users/candidate/${id}`);
  }

  updateCandidate(candidate: CandidateProfiles): Observable<CandidateProfiles> {
    return this.httpClient.put<CandidateProfiles>(`${this.url}/users/candidate/${candidate.id}`, candidate);
  }

  getCompanybyId(id: number): Observable<CompanyProfiles> {
    return this.httpClient.get<CompanyProfiles>(`${this.url}/users/company/${id}`);
  }

  updateCompany(company: CompanyProfiles): Observable<CompanyProfiles> {
    return this.httpClient.put<CompanyProfiles>(`${this.url}/users/company/${company.id}`, company);
  }

  getReviews(companyUserId: number, ratingFilter?: number, myUserId?: number): Observable<any> {
    let params = '';
    if (ratingFilter) params += `?ratingFilter=${ratingFilter}`;
    if (myUserId) params += `${params ? '&' : '?'}myUserId=${myUserId}`;
    return this.httpClient.get<any>(`${this.url}/api/reviews/company/${companyUserId}${params}`);
  }

  submitReview(companyUserId: number, body: object): Observable<any> {
    return this.httpClient.post<any>(`${this.url}/api/reviews/company/${companyUserId}`, body);
  }

  getSalaries(companyUserId: number): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.url}/api/salaries/company/${companyUserId}`);
  }

  updateReview(reviewId: number, body: object): Observable<any> {
    return this.httpClient.put<any>(`${this.url}/api/reviews/${reviewId}`, body);
  }

  submitSalary(companyUserId: number, body: object): Observable<any> {
    return this.httpClient.post<any>(`${this.url}/api/salaries/company/${companyUserId}`, body);
  }
}
