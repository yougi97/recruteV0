import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

export type CandidateCvUploadFormValue = {
  file: File | null;
};

@Component({
  selector: 'app-candidate-cv-upload-form-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './candidate-cv-upload-form-card.html',
  styleUrl: './candidate-cv-upload-form-card.scss',
})
export class CandidateCvUploadFormCard {
  @Input() currentCvFileName = '';
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<CandidateCvUploadFormValue>();

  selectedFile: File | null = null;

  get selectedFileLabel(): string {
    return this.selectedFile?.name || 'Choisir un PDF';
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile = file;
  }

  onSubmit(): void {
    this.save.emit({
      file: this.selectedFile,
    });
  }
}
