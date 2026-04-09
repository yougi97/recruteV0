import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './login/login';
import { Register } from './register/register';
import { Profile } from './profil/profil';


export const routes: Routes = [
    {path:'', component: Home},
    {path:'login', component: Login},
    {path:'register', component: Register},
    {path: 'profile', component: Profile}
];
