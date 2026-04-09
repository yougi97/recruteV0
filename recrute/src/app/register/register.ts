import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../services/auth';
import { User } from '../model/user';
import { CandidateProfiles } from '../model/candidateProfiles';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyProfiles } from '../model/companyProfiles';
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly recruteapi = inject(AuthService)
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  activeTab: string = 'entreprise';

  setTab(tab: string) {
    this.activeTab = tab;
  }
  registerEntrepriseForm: FormGroup;
  registerCandidatForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.registerCandidatForm = this.fb.group({
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirm: ['', [Validators.required, Validators.minLength(6)]]
    });
    this.registerEntrepriseForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirm: ['', [Validators.required, Validators.minLength(6)]]
    });

  }
  onSubmit(): void {
    if (this.activeTab == "candidat") {
      if (this.registerCandidatForm.valid) {
        console.log("candidat")
        const formValue = this.registerCandidatForm.value
        let user: User;
        let candidat: CandidateProfiles;

        user = {
          "email": formValue.email,
          "password": formValue.password,
          "userType": "candidate",
          "firstName": formValue.name,
          "lastName": formValue.lastName,
          "createdAt": new Date,
        }
        candidat = {
          "user": user,
        }
        this.recruteapi.createCandidate(candidat).subscribe(() => this.router.navigate([`/login`]));
      }
      else {
        console.log(this.registerCandidatForm.value)
      }
    }
    if (this.activeTab == "entreprise") {
      if (this.registerEntrepriseForm.valid) {
        console.log("entreprise")
        const formValue = this.registerEntrepriseForm.value
        let user: User;
        let company: CompanyProfiles;

        user = {
          "email": formValue.email,
          "password": formValue.password,
          "userType": "company",
          "createdAt": new Date,
        }
        company = {
          "user": user,
          "companyName": formValue.name
        }
        this.recruteapi.createCompany(company).subscribe(() => this.router.navigate([`/login`]));
      }
      else {
        console.log(this.registerCandidatForm.value)
      }

    }
  }
}

