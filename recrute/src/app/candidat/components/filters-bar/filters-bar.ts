import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OfferFilters, WorkMode, ContractType } from '../../../model/job-offer';

@Component({
  selector: 'app-filters-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filters-bar.html',
  styleUrls: ['./filters-bar.scss'],
})
export class FiltersBarComponent implements OnInit {
  @Output() filtersChange = new EventEmitter<OfferFilters>();

  contractTypes: ContractType[] = ['CDI', 'CDD', 'Alternance', 'Stage', 'Freelance'];
  workModes: WorkMode[] = ['Présentiel', 'Hybride', 'Remote'];
  matchThresholds = [
    { label: 'Tous', value: 0 },
    { label: '≥ 70%', value: 70 },
    { label: '≥ 85%', value: 85 },
  ];

  filters: OfferFilters = {
    contractType: null,
    workMode: null,
    minMatch: 0,
  };

  ngOnInit(): void {
    this.emit();
  }

  setContract(type: ContractType): void {
    this.filters.contractType = this.filters.contractType === type ? null : type;
    this.emit();
  }

  setWorkMode(mode: WorkMode): void {
    this.filters.workMode = this.filters.workMode === mode ? null : mode;
    this.emit();
  }

  setMinMatch(value: number): void {
    this.filters.minMatch = value;
    this.emit();
  }

  reset(): void {
    this.filters = { contractType: null, workMode: null, minMatch: 0 };
    this.emit();
  }

  private emit(): void {
    this.filtersChange.emit({ ...this.filters });
  }
}