import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

export type CandidatePersonalInfoInitialValue = {
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  location: string;
};

export type CandidatePersonalInfoFormValue = {
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  location: string;
};

@Component({
  selector: 'app-candidate-personal-info-form-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './candidate-personal-info-form-card.html',
  styleUrl: './candidate-personal-info-form-card.scss',
})
export class CandidatePersonalInfoFormCard implements OnChanges {
  @Input() initialValue: CandidatePersonalInfoInitialValue | null = null;
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<CandidatePersonalInfoFormValue>();

  readonly form;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      title: [''],
      location: [''],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue'] && this.initialValue) {
      this.form.patchValue({
        firstName: this.initialValue.firstName,
        lastName: this.initialValue.lastName,
        email: this.initialValue.email,
        title: this.initialValue.title,
        location: this.initialValue.location,
      });
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.save.emit({
      firstName: value.firstName ?? '',
      lastName: value.lastName ?? '',
      email: value.email ?? '',
      title: value.title ?? '',
      location: value.location ?? '',
    });
  }
}
