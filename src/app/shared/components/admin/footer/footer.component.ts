import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  // Propriétés pour les informations système
  currentDate: Date = new Date();
  currentYear: number = new Date().getFullYear();

  // Statistiques système
  activeUsers: number = 0;
  serverStatus: string = 'Online';
  lastActivity: Date = new Date();

  ngOnInit(): void {
    this.initializeSystemData();
    this.startRealTimeUpdates();
  }

  private initializeSystemData(): void {
    // Simuler les données système (à remplacer par de vraies données d'API)
    this.activeUsers = Math.floor(Math.random() * 50) + 10;
    this.serverStatus = 'Online';
    this.lastActivity = new Date();

    // Mettre à jour la date actuelle
    this.currentDate = new Date();
  }

  private startRealTimeUpdates(): void {
    // Mettre à jour les statistiques toutes les 30 secondes
    setInterval(() => {
      this.activeUsers = Math.floor(Math.random() * 50) + 10;
      this.lastActivity = new Date();
    }, 30000);

    // Mettre à jour l'heure chaque minute
    setInterval(() => {
      this.currentDate = new Date();
    }, 60000);
  }
}
