import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeroAboutComponent } from './components/hero-about/hero-about';
import { StatsComponent } from './components/stats/stats';
import { ValuesComponent } from './components/values/values';
import { TeamComponent } from './components/team/team';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule, HeroAboutComponent, StatsComponent, ValuesComponent, TeamComponent],
  templateUrl: './about.html',
  styleUrls: ['./about.scss'],
})
export class AboutComponent {}