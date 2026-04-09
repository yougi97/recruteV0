import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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

  createCandidate(candidate: CandidateProfiles): Observable<CandidateProfiles> {
    return this.httpClient.post<CandidateProfiles>(`${this.url}/users/candidate`, candidate);
  }

  createCompany(company: CompanyProfiles): Observable<CompanyProfiles> {
    return this.httpClient.post<CompanyProfiles>(`${this.url}/users/company`, company);
  }
}