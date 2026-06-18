import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, switchMap, map, tap, catchError, throwError } from 'rxjs';

export interface EvenementLieu {
  nom?: string;
  adresse1?: string;
  adresse2?: string;
  codePostal: string;
  commune: string;
  coordonnees?: { longitude: number; latitude: number };
}

export interface Evenement {
  id: string;
  intitule: string;
  urlEvenement?: string;
  organisme?: string;
  typeEvenement: { code: string; libelle: string };
  dateDebut: string;
  dateFin: string;
  lieu: EvenementLieu;
  description?: string;
  secteurActivite?: Array<{ code: string; libelle: string }>;
  typeContrat?: Array<{ code: string; libelle: string }>;
  nombreOffresEmploi?: number;
}

interface FtToken {
  access_token: string;
  expires_in: number;
}

const FT_CLIENT_ID = 'PAR_recrute_ec46b5ead54bd1455fafc2272f636e2ed7812114413e74eb38c516b7992a6ed3';
const FT_CLIENT_SECRET = '1dca5f0d19f3bc547d14a12742a5055a8db587a58d7c728c2cafd46ade97eeed';

@Injectable({ providedIn: 'root' })
export class SalonsService {
  private readonly apiBase = '/partenaire/evenements/v1';
  private readonly tokenUrl = '/connexion/oauth2/access_token?realm=%2Fpartenaire';

  private cachedToken: string | null = null;
  private tokenExpiry = 0;

  constructor(private http: HttpClient) {}

  private getToken(): Observable<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiry) {
      return of(this.cachedToken);
    }

    const scope = `api_evenementsv1 evenements application_${FT_CLIENT_ID}`;

    const body = new HttpParams()
      .set('grant_type', 'client_credentials')
      .set('client_id', FT_CLIENT_ID)
      .set('client_secret', FT_CLIENT_SECRET)
      .set('scope', scope);

    return this.http.post<FtToken>(this.tokenUrl, body.toString(), {
      headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
    }).pipe(
      tap(res => {
        this.cachedToken = res.access_token;
        this.tokenExpiry = Date.now() + (res.expires_in - 60) * 1000;
      }),
      map(res => res.access_token),
      catchError(err => throwError(() => err))
    );
  }

  searchEvenements(codePostal: string, distance: number = 50): Observable<Evenement[]> {
    return this.getToken().pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        });
        return this.http.post<any>(`${this.apiBase}/mee/evenements`, { codePostal: [codePostal], distance }, { headers });
      }),
      map(res => (res?.content ?? []).map((ev: any): Evenement => this.mapApiEvenement(ev))),
      catchError(err => { console.error('[SalonsService] error:', err); return of([]); })
    );
  }

  private mapApiEvenement(ev: any): Evenement {
    const dateBase = ev.dateEvenement?.substring(0, 10) ?? '';
    const isOnline = ev.modalites?.some((m: string) => m.toLowerCase().includes('distance'));
    return {
      id: String(ev.id),
      intitule: ev.titre ?? ev.description ?? '',
      urlEvenement: ev.urlDetailEvenement,
      organisme: ev.libelleOrganisateurPrincipal,
      typeEvenement: { code: isOnline ? 'SEL' : 'PRE', libelle: ev.type ?? '' },
      dateDebut: dateBase ? `${dateBase}T${ev.heureDebut ?? '00:00:00'}+00:00` : (ev.dateEvenement ?? ''),
      dateFin:   dateBase ? `${dateBase}T${ev.heureFin  ?? ev.heureDebut ?? '00:00:00'}+00:00` : (ev.dateEvenement ?? ''),
      lieu: {
        nom: ev.libelleEtablissement,
        codePostal: ev.codePostal ?? '',
        commune: ev.ville ?? '',
        coordonnees: (ev.latitude && ev.longitude) ? { latitude: ev.latitude, longitude: ev.longitude } : undefined
      },
      description: ev.description,
      secteurActivite: ev.codesRome?.map((code: string) => ({ code, libelle: code })),
      typeContrat: ev.benefices?.map((b: string) => ({ code: b, libelle: b })),
      nombreOffresEmploi: ev.offresId?.length || undefined
    };
  }

  getEvenement(id: string): Observable<Evenement | null> {
    return this.getToken().pipe(
      switchMap(token => {
        const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' });
        return this.http.get<any>(`${this.apiBase}/mee/evenements/${id}`, { headers });
      }),
      map(ev => this.mapApiEvenement(ev)),
      catchError(() => of(null))
    );
  }

  geocodePostalCode(codePostal: string): Observable<{ lat: number; lng: number; commune: string } | null> {
    return this.http.get<any>(`https://api-adresse.data.gouv.fr/search/?q=${codePostal}&type=municipality&limit=1`).pipe(
      map(res => {
        const feature = res?.features?.[0];
        if (!feature) return null;
        const [lng, lat] = feature.geometry.coordinates;
        const commune = feature.properties.city || feature.properties.label;
        return { lat, lng, commune };
      }),
      catchError(() => of(null))
    );
  }
}
