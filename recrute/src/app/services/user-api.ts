import { Injectable,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class UserApi {

  private readonly httpClient = inject(HttpClient)
  private readonly url = "http://localhost:8080/users";
  http: any;



















  
 getUsers(): Observable<User[]> {
  return this.httpClient.get<User[]>('...');
}
}
