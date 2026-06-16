import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

export type CandidateBioFormValue = {
  bio: string;
};

@Component({
  selector: 'app-candidate-bio-form-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './candidate-bio-form-card.html',
  styleUrl: './candidate-bio-form-card.scss',
})
export class CandidateBioFormCard implements OnChanges {
  @Input() initialBio = '';
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<CandidateBioFormValue>();

  readonly form;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      bio: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialBio']) {
      this.form.patchValue({ bio: this.initialBio });
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
      bio: value.bio ?? '',
    });
  }
}
