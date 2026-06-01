import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './login/login';
import { UpdateCandidate } from './update-candidate/update-candidate';
import { UpdateCompany } from './update-company/update-company';
import { CompanyHome } from './company-home/company-home';
import { Register } from './register/register';
import { Profile } from './profil/profil';
import { AboutComponent } from './about/about';
import { CandidatComponent } from './candidat/candidat';
import { OffresComponent } from './offres/offres';
import { CompanyOffers } from './company-offers/company-offers';
import { MesCandidaturesComponent } from './mes-candidatures/mes-candidatures';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'login', component: Login },
    { path: 'users/candidate/:id/update', component: UpdateCandidate },
    { path: 'users/company/:id/update', component: UpdateCompany },
    { path: 'users/company/:id', component: CompanyHome },
    { path: 'register', component: Register },
    { path: 'profil', component: Profile },
    { path: 'profile', redirectTo: 'profil', pathMatch: 'full' },
    { path: 'candidat', component: CandidatComponent },
    { path: 'offres', component: OffresComponent },
    { path: 'mes-candidatures', component: MesCandidaturesComponent },
    { path: 'about', component: AboutComponent },
    { path: 'company-offers', component: CompanyOffers },
];
