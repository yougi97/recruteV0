import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Value {
  icon: string;
  title: string;
  description: string;
  color: string;
}

@Component({
  selector: 'app-values',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './values.html',
  styleUrls: ['./values.scss'],
})
export class ValuesComponent {
  values: Value[] = [
    {
      icon: '🔍',
      title: 'Transparence',
      description: 'Chaque suggestion de notre IA est expliquée. Vous savez toujours pourquoi une offre vous est proposée ou pourquoi un candidat est mis en avant.',
      color: 'blue',
    },
    {
      icon: '🔒',
      title: 'Confidentialité des données',
      description: 'Vos données personnelles ne sont jamais revendues. Elles sont utilisées uniquement pour améliorer votre expérience sur la plateforme, conformément au RGPD.',
      color: 'green',
    },
    {
      icon: '⚖️',
      title: 'Inclusivité & anti-biais',
      description: 'Notre IA est entraînée pour ignorer l\'origine, le genre ou l\'âge. Seules les compétences et les compatibilités professionnelles guident les recommandations.',
      color: 'purple',
    },
    {
      icon: '🤝',
      title: 'Humanité avant tout',
      description: 'La technologie est un outil, pas un décideur. L\'humain reste au centre : chaque mise en relation passe par le choix libre du candidat et de l\'entreprise.',
      color: 'amber',
    },
  ];
}