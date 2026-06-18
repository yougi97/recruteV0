import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SalonsService, Evenement } from '../services/salons.service';

@Component({
  selector: 'app-salons',
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet, FormsModule, RouterModule],
  templateUrl: './salons.html',
  styleUrls: ['./salons.scss']
})
export class SalonsComponent implements OnInit {
  evenements: Evenement[] = [];
  selectedEvenement: Evenement | null = null;
  isLoading = false;
  errorMessage = '';
  codePostal = '';
  detectedCommune = '';

  private readonly distance = 50;

  constructor(
    private salonsService: SalonsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.tryGeolocation();
  }

  tryGeolocation(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => this.reverseGeocode(pos.coords.latitude, pos.coords.longitude),
      () => {}
    );
  }

  private reverseGeocode(lat: number, lng: number): void {
    fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${lng}&lat=${lat}`)
      .then(r => r.json())
      .then(data => {
        const feature = data?.features?.[0];
        if (feature) {
          this.codePostal = feature.properties.postcode || '';
          this.detectedCommune = feature.properties.city || '';
          this.cdr.detectChanges();
          if (this.codePostal) this.search();
        }
      })
      .catch(() => {});
  }

  search(): void {
    if (!this.codePostal.trim()) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.evenements = [];
    this.selectedEvenement = null;

    this.salonsService.searchEvenements(this.codePostal.trim(), this.distance).subscribe({
      next: data => {
        this.evenements = data;
        this.isLoading = false;
        if (data.length === 0) {
          this.errorMessage = 'Aucun salon trouvé dans cette zone. Essayez un autre code postal.';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Erreur lors de la recherche.';
        this.cdr.detectChanges();
      }
    });
  }

  selectEvenement(ev: Evenement): void {
    this.selectedEvenement = ev;
  }

  closeDetail(): void {
    this.selectedEvenement = null;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  isOnline(ev: Evenement): boolean {
    return ev.typeEvenement?.code === 'SEL' || ev.typeEvenement?.libelle?.toLowerCase().includes('ligne');
  }
}
