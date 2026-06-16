import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

export type JobOfferCreateFormValue = {
  title: string;
  description: string;
  location: string;
  contractType: 'CDI' | 'CDD' | 'freelance' | 'stage' | 'alternance';
};

export type JobOfferFormMode = 'create' | 'edit';

@Component({
  selector: 'app-job-offer-form-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './job-offer-form-card.html',
  styleUrl: './job-offer-form-card.scss',
})
export class JobOfferFormCard {
  @Input() mode: JobOfferFormMode = 'create';
  @Input() initialValue: Partial<JobOfferCreateFormValue> | null = null;
  @Output() cancel = new EventEmitter<void>();
  @Output() submitOffer = new EventEmitter<JobOfferCreateFormValue>();

  readonly form;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    location: ['', [Validators.required]],
      contractType: ['CDI', [Validators.required]],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue']) {
      const next = this.initialValue;
      this.form.patchValue({
        title: next?.title ?? '',
        description: next?.description ?? '',
        location: next?.location ?? '',
        contractType: next?.contractType ?? 'CDI',
      });
    }
  }

  get cardTitle(): string {
    return this.mode === 'edit' ? 'Modifier une offre' : 'Nouvelle offre';
  }

  get submitLabel(): string {
    return this.mode === 'edit' ? 'Enregistrer' : 'Créer l\'offre';
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
    this.submitOffer.emit({
      title: value.title ?? '',
      description: value.description ?? '',
      location: value.location ?? '',
      contractType: (value.contractType as JobOfferCreateFormValue['contractType']) ?? 'CDI',
    });
  }
}
