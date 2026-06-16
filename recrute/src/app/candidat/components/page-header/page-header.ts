import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-header.html',
  styleUrls: ['./page-header.scss'],
})
export class PageHeaderComponent {
  @Input() totalCount: number = 0;
  @Input() interestedCount: number = 0;
  @Input() lastUpdated: string = '';
  @Input() isRefreshing: boolean = false;
  @Output() refresh = new EventEmitter<void>();

  onRefresh(): void {
    this.refresh.emit();
  }
}