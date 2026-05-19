import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobOffer } from '../../../model/job-offer';

@Component({
  selector: 'app-job-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './job-card.html',
  styleUrls: ['./job-card.scss'],
})
export class JobCardComponent {
  @Input() offer?: JobOffer;
  @Output() interested = new EventEmitter<JobOffer>();
  @Output() dismissed = new EventEmitter<JobOffer>();

  get matchIcon(): string {
    const offer = this.offer;
    if (!offer) return '';
    const map: Record<JobOffer['matchLevel'], string> = {
      high: '✦',
      mid: '◈',
      low: '○',
    };
    return map[offer.matchLevel];
  }

  onInterest(): void {
    const offer = this.offer;
    if (!offer) return;
    this.interested.emit(offer);
  }

  onDismiss(): void {
    const offer = this.offer;
    if (!offer) return;
    this.dismissed.emit(offer);
  }
}