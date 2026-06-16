import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JobOffer } from '../model/job-offer';

@Injectable({ providedIn: 'root' })
export class OffersApi {
  private readonly httpClient = inject(HttpClient);
  private readonly url = 'https://localhost';

  getCompanyOffers(companyId: number): Observable<JobOffer[]> {
    return this.httpClient.get<JobOffer[]>(`${this.url}/offers/company/${companyId}`);
  }
}
