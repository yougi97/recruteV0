import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

export type CompanyDescriptionFormValue = {
  description: string;
  password: string;
};

@Component({
  selector: 'app-company-description-form-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './company-description-form-card.html',
  styleUrl: './company-description-form-card.scss',
})
export class CompanyDescriptionFormCard implements OnChanges {
  @Input() initialDescription = '';
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<CompanyDescriptionFormValue>();

  readonly form;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(10)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialDescription']) {
      this.form.patchValue({
        description: this.initialDescription,
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
      description: value.description ?? '',
      password: value.password ?? '',
    });
  }
}
