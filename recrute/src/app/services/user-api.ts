import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../model/user';

@Injectable({
  providedIn: 'root',
})
export class UserApi {

  private readonly httpClient = inject(HttpClient)
  private readonly url = "https://localhost/users";

  getUsers(): Observable<User[]> {
    return this.httpClient.get<User[]>('...');
  }
}
