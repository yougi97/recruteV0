import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Stat {
  value: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.html',
  styleUrls: ['./stats.scss'],
})
export class StatsComponent {
  stats: Stat[] = [
    { value: '32 000+', label: 'Candidats inscrits',    icon: '👤' },
    { value: '4 200+',  label: 'Entreprises partenaires', icon: '🏢' },
    { value: '18 000+', label: 'Offres activées',        icon: '💼' },
    { value: '87%',     label: 'Taux de match réussi',   icon: '🎯' },
  ];
}