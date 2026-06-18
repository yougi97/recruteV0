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
import { MessagerieComponent } from './messagerie/messagerie';
import { CandidatePublicView } from './candidate-public-view/candidate-public-view';
import { Contact } from './contact/contact';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'login', component: Login },
    { path: 'candidate-profile/:id', component: CandidatePublicView },
    { path: 'candidate-profile/:id/update', component: UpdateCandidate },
    { path: 'company-profile/:id/update', component: UpdateCompany },
    { path: 'company-profile/:id', component: CompanyHome },
    { path: 'register', component: Register },
    { path: 'profil', component: Profile },
    { path: 'profile', redirectTo: 'profil', pathMatch: 'full' },
    { path: 'candidat', component: CandidatComponent },
    { path: 'offres', component: OffresComponent },
    { path: 'mes-candidatures', component: MesCandidaturesComponent },
    { path: 'about', component: AboutComponent },
    { path: 'company-offers', component: CompanyOffers },
    { path: 'messagerie', component: MessagerieComponent },
    { path: 'contact',component: Contact },
];
