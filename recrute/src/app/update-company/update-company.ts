import { Component, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RecruteApi } from '../recrute-api';
import { toSignal } from '@angular/core/rxjs-interop';
import { CandidateProfiles } from '../model/candidateProfiles';
import { User } from '../model/user';
import { CompanyProfiles } from '../model/companyProfiles';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-update-company',
  imports: [FormsModule],
  templateUrl: './update-company.html',
  styleUrl: './update-company.scss',
})
export class UpdateCompany {
  private route = inject(ActivatedRoute);
  userid = this.route.snapshot.params['id'];
  private readonly recruteApi = inject(RecruteApi);
  $company = this.recruteApi.getCompanybyId(this.userid);
  company = toSignal(this.$company);
  email: string = "";
  password: string = "";
  firstName?: string = "";
  lastName?: string = "";
  companyName: string = "";
  location?: string = "";
  industry?: JSON;
  description?: string = "";
  private router = inject(Router);

  constructor() {
    // Quand le film est chargé → on initialise les champs
    console.log("UpdateCandidate loaded");
    effect(() => {
      const m = this.company();
      if (m) {
        this.email = m.user.email;
        this.password = m.user.password;
        this.firstName = m.user.firstName;
        this.lastName = m.user.lastName;
        this.companyName = m.companyName;
        this.location = m.location;
        this.industry = m.industry;
        this.description = m.description;
      }
    });
  }

  updateCandidate(company: CompanyProfiles): void {
    let user: User
    let data: CompanyProfiles
    user = {
      "id": company.user.id,
      "email": this.email,
      "password": this.password,
      "userType": company.user.userType,
      "firstName": this.firstName,
      "lastName": this.lastName,
      "createdAt": company.user.createdAt,
    }
    data = {
      "id": company.id,
      "user": user,
      "companyName": this.companyName,
      "industry": this.industry,
      "location": this.location,
      "description": this.description,
    };
    this.recruteApi.updateCompany(data).subscribe(() => this.router.navigate([`/users/company/${company.id}`]));

  }
}
