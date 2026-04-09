import { Component, inject } from '@angular/core';
import { UserApi } from '../services/user-api';
import { User } from '../model/user';
import { Observable } from 'rxjs';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

  private readonly userApi = inject(UserApi);

  users$: Observable<User[]> = this.userApi.getUsers();

}