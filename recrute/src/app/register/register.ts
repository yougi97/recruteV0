import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth';
import { CandidateProfiles } from '../model/candidateProfiles';
import { CompanyProfiles } from '../model/companyProfiles';
import { User } from '../model/user';

type RegisterFormValue = {
  name: string;
  lastname: string;
  email: string;
  password: string;
  passwordConfirm: string;
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  activeTab = 'entreprise';
  registerForm: FormGroup;

  setTab(tab: string) {
    this.activeTab = tab;
  }

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private toastr: ToastrService) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      lastname: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirm: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  private isEmailFormatValid(email: string): boolean {
    return /^\S+@\S+\.\S+$/.test(email);
  }

  private getFormValue(): RegisterFormValue {
    const value = this.registerForm.value;
    return {
      name: String(value.name ?? '').trim(),
      lastname: String(value.lastname ?? '').trim(),
      email: String(value.email ?? '').trim(),
      password: String(value.password ?? ''),
      passwordConfirm: String(value.passwordConfirm ?? ''),
    };
  }

  private getValidationError(formValue: RegisterFormValue): string | null {
    if (!formValue.name) {
      return 'Le nom est obligatoire.';
    }

    if (this.activeTab === 'candidat' && !formValue.lastname) {
      return 'Le prénom est obligatoire.';
    }

    if (!formValue.email) {
      return 'L\'email est obligatoire.';
    }

    if (!this.isEmailFormatValid(formValue.email)) {
      return 'Le format de l\'email est invalide.';
    }

    if (formValue.password.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    }

    if (formValue.password !== formValue.passwordConfirm) {
      return 'Les mots de passe ne correspondent pas.';
    }

    return null;
  }

  private buildUser(formValue: RegisterFormValue): User {
    return {
      email: formValue.email,
      password: formValue.password,
      userType: this.activeTab === 'entreprise' ? 'company' : 'candidate',
      firstName: formValue.name,
      lastName: formValue.lastname,
      createdAt: new Date(),
    };
  }

  private createRegisterRequest(user: User, formValue: RegisterFormValue): Observable<CandidateProfiles | CompanyProfiles> {
    return this.activeTab === 'entreprise'
      ? this.authService.createCompany({ user, companyName: formValue.name } as CompanyProfiles)
      : this.authService.createCandidate({ user } as CandidateProfiles);
  }

  onSubmit() {
    const formValue = this.getFormValue();
    const validationError = this.getValidationError(formValue);

    if (validationError) {
      this.registerForm.markAllAsTouched();
      this.toastr.warning(validationError, 'Formulaire invalide');
      return;
    }

    const user = this.buildUser(formValue);
    const request = this.createRegisterRequest(user, formValue);

    request.subscribe({
      next: () => {
        this.toastr.success('Inscription réussie! Connectez-vous.', 'Succès');
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err: unknown) => {
        console.error('Registration error:', err);
        this.toastr.error('Erreur lors de l\'inscription', 'Erreur');
      },
    });
  }
}

