import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth';
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
       this.authService.register(this.registerForm.value)
        .subscribe({
          next: (res) => {
            console.log('Inscription réussie', res);
          },
          error: (err) => {
            console.error('Erreur lors de l\'inscription', err);
          }
        });

    }
  }
}

