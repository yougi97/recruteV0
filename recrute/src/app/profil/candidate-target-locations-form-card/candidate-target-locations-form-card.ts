import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

export type CandidateTargetLocationsFormValue = {
  targetLocations: string[];
};

@Component({
  selector: 'app-candidate-target-locations-form-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './candidate-target-locations-form-card.html',
  styleUrl: './candidate-target-locations-form-card.scss',
})
export class CandidateTargetLocationsFormCard implements OnChanges {
  @Input() initialLocations: string[] = [];
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<CandidateTargetLocationsFormValue>();

  readonly form;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      locations: ['', [Validators.required]],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialLocations']) {
      this.form.patchValue({
        locations: (this.initialLocations ?? []).join(', '),
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
    const targetLocations = (value.locations ?? '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    this.save.emit({
      targetLocations,
    });
  }
}
