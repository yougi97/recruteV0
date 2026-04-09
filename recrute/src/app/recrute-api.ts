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
  private readonly url = "http://localhost:8080"

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
}
