import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth';
import { CandidateProfiles } from '../model/candidateProfiles';
import { CompanyProfiles } from '../model/companyProfiles';
import { User } from '../model/user';
@Component({
  selector: 'app-register',
  imports: [],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {

  activeTab: string = 'entreprise';

  setTab(tab: string) {
    this.activeTab = tab;
  }
  registerForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirm: ['', [Validators.required, Validators.minLength(6)]]
    });

  }
  onSubmit() {
    if (this.registerForm.valid) {
      const formValue = this.registerForm.value;
      const user: User = {
        email: formValue.email,
        password: formValue.password,
        userType: this.activeTab === 'entreprise' ? 'COMPANY' : 'CANDIDATE',
        firstName: formValue.name,
        lastName: formValue.lastname,
        createdAt: new Date(),
      };

      const request: Observable<CandidateProfiles | CompanyProfiles> = this.activeTab === 'entreprise'
        ? this.authService.createCompany({
          user,
          companyName: formValue.name,
        } as CompanyProfiles)
        : this.authService.createCandidate({
          user,
        } as CandidateProfiles);

      request.subscribe({
        next: (res: CandidateProfiles | CompanyProfiles) => {
          console.log('Inscription reussie', res);
        },
        error: (err: unknown) => {
          console.error('Erreur lors de l\'inscription', err);
        },
      });

    }
  }
}

