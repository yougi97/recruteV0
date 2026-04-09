import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

export type CompanyInfoInitialValue = {
  companyName: string;
  industry: string;
  location: string;
  email: string;
};

export type CompanyInfoFormValue = {
  companyName: string;
  industry: string;
  location: string;
  email: string;
  password: string;
};

@Component({
  selector: 'app-company-info-form-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './company-info-form-card.html',
  styleUrl: './company-info-form-card.scss',
})
export class CompanyInfoFormCard implements OnChanges {
  @Input() initialValue: CompanyInfoInitialValue | null = null;
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<CompanyInfoFormValue>();

  readonly form;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      industry: [''],
      location: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue'] && this.initialValue) {
      this.form.patchValue({
        companyName: this.initialValue.companyName,
        industry: this.initialValue.industry,
        location: this.initialValue.location,
        email: this.initialValue.email,
        password: '',
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
      companyName: value.companyName ?? '',
      industry: value.industry ?? '',
      location: value.location ?? '',
      email: value.email ?? '',
      password: value.password ?? '',
    });
  }
}
