import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobOffer } from '../../../model/job-offer';
import { norm } from '../../../utils/normalize';

@Component({
  selector: 'app-job-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './job-card.html',
  styleUrls: ['./job-card.scss'],
})
export class JobCardComponent {
  private _offer?: JobOffer;
  @Input()
  set offer(value: JobOffer | undefined) {
    this._offer = value;
  }
  get offer(): JobOffer | undefined { return this._offer; }

  @Input() compact = false;
  @Input() clickableTags = false;
  @Input() highlightTag: string | null = null;
  @Input() cvSkills: { name: string; level: string; type: string }[] = [];

  @Output() interested = new EventEmitter<JobOffer>();
  @Output() dismissed = new EventEmitter<JobOffer>();
  @Output() tagClick = new EventEmitter<string>();
  @Output() detail = new EventEmitter<JobOffer>();

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

  onTagClick(label: string): void {
    if (this.clickableTags) {
      this.tagClick.emit(label);
    }
  }

  onDetail(): void {
    const offer = this.offer;
    if (!offer) return;
    this.detail.emit(offer);
  }

  get matchingSkills(): { label: string; level: string }[] {
    if (!this.offer?.jobSkills?.length || !this.cvSkills.length) return [];
    const cvMap = new Map(this.cvSkills.map(s => [norm(s.name), s.level]));
    return this.offer.jobSkills
      .filter(s => cvMap.has(norm(s.name)))
      .map(s => ({ label: s.name, level: cvMap.get(norm(s.name)) ?? '' }))
      .slice(0, 5);
  }

  pct(v: number): number {
    return Math.round((v ?? 0) * 100);
  }
}
