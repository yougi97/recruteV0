import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './login/login';
import { UpdateCandidate } from './update-candidate/update-candidate';
import { UpdateCompany } from './update-company/update-company';
import { CompanyHome } from './company-home/company-home';
import { Register } from './register/register';
import { Profile } from './profil/profil';


export const routes: Routes = [
    { path: '', component: Home },
    { path: 'login', component: Login },
    { path: 'users/candidate/:id/update', component: UpdateCandidate },
    { path: 'users/company/:id/update', component: UpdateCompany },
    { path: 'users/company/:id', component: CompanyHome },
    { path: 'register', component: Register },
    { path: 'profile', component: Profile},
    { path: 'candidate-home', component: CompanyHome},
];
