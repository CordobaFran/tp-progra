import { Component, OnInit } from '@angular/core';
import { TeamConfigService } from './service/team-config.service';

@Component({
  selector: 'app-team-config',
  templateUrl: './team-config.component.html',
  styleUrls: ['./team-config.component.css'],
  standalone: false,
})
export class TeamConfigComponent implements OnInit {
  configuracion: any;

  constructor(private readonly teamConfigService: TeamConfigService) {}

  ngOnInit(): void {
    this.teamConfigService.getTeamConfiguration('team-1').subscribe((datos) => {
      this.configuracion = datos;
      console.log('Datos recibidos:', datos);
    });
  }
}