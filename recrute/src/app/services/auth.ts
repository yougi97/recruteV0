import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CandidateProfiles } from '../model/candidateProfiles';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly httpClient = inject(HttpClient)
  private readonly url = "http://localhost:8080"

  getCandidatebyId(id: number): Observable<CandidateProfiles> {
    return this.httpClient.get<CandidateProfiles>(`${this.url}/users/candidate/${id}`);
  }
}