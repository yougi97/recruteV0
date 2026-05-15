import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TeamMember {
  name: string;
  role: string;
  initials: string;
  color: string;
  description: string;
}

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team.html',
  styleUrls: ['./team.scss'],
})
export class TeamComponent {
  members: TeamMember[] = [
    {
      name: 'Adam Benlaharche',
      role: 'Chef de projet',
      initials: 'AB',
      color: 'blue',
      description: 'Coordination générale du projet, gestion des priorités et liaison entre les équipes.',
    },
    {
      name: 'Daphnée Jérome',
      role: 'Responsable Backend',
      initials: 'DJ',
      color: 'green',
      description: 'Architecture des APIs, base de données et logique métier côté serveur.',
    },
    {
      name: 'Antonin Rossin',
      role: 'Responsable IA',
      initials: 'AR',
      color: 'purple',
      description: 'Conception et entraînement des modèles de matching, anti-biais et scoring.',
    },
    {
      name: 'Ulric Martingoulet',
      role: 'Responsable Frontend',
      initials: 'UM',
      color: 'sky',
      description: 'Développement de l\'interface utilisateur, expérience candidat et entreprise.',
    },
    {
      name: 'Solène Martinez',
      role: 'Responsable DevOps',
      initials: 'SM',
      color: 'amber',
      description: 'Infrastructure, déploiement continu, monitoring et sécurité de la plateforme.',
    },
    {
      name: 'Julie Nicolas',
      role: 'Responsable Data',
      initials: 'JN',
      color: 'coral',
      description: 'Collecte, traitement et analyse des données pour alimenter les modèles IA.',
    },
  ];
}