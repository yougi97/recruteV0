import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero-about.html',
  styleUrls: ['./hero-about.scss'],
})
export class HeroAboutComponent {}