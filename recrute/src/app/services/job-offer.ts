import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JobOffer } from '../model/job-offer';

@Injectable({ providedIn: 'root' })
export class JobOfferService {
  private apiUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  getSuggestions(candidateId: number): Observable<JobOffer[]> {
    return this.http.get<JobOffer[]>(`${this.apiUrl}/users/candidate/${candidateId}/suggestions`);
  }

  notifyInterest(candidateId: number, offerId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/candidate/${candidateId}/offers/${offerId}/interest`, {});
  }

  dismissOffer(candidateId: number, offerId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/candidate/${candidateId}/offers/${offerId}/dismiss`, {});
  }
}