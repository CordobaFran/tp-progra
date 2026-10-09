import { Component, OnInit } from '@angular/core';
import { TeamConfigService } from './service/team-config.service';
import { AppContextService } from '../../../core/services/app-context.service';
import { HeroArtworkResolverService } from '../../../core/services/hero-artwork-resolver.service';

@Component({
  selector: 'app-team-config',
  templateUrl: './team-config.component.html',
  styleUrls: ['./team-config.component.css'],
  standalone: false,
})
export class TeamConfigComponent implements OnInit {
  configuracion: any;
  heroes: any[] = [];
  teamId: string = '';

  constructor( // inyecté AppContextService para acceder al estado global de la aplicación (donde vive el teamId asignado)
    private readonly teamConfigService: TeamConfigService,
    private readonly appContextService: AppContextService,
    private readonly artworkService: HeroArtworkResolverService, 
  ) {}

  ngOnInit(): void {
    // Verificamos directamente si el contexto y el teamId existen
    const resolvedTeamId = this.appContextService.current?.teamId || 'hulk';
    this.teamId = resolvedTeamId;

    // Consultamos la configuración con el ID dinámico
    this.teamConfigService.getTeamConfiguration(this.teamId).subscribe((datos: any) => {
      console.log('Respuesta cruda del backend:', datos);
      this.configuracion = datos;
    });

    // Traemos los héroes del equipo para armar la lista en la pantalla
    this.teamConfigService.getMyTeamHeroes().subscribe((resp: any) => {
      this.heroes = resp?.data?.heroes ?? resp?.heroes ?? resp ?? [];
    });
  }

  // Devuelve la imagen del héroe segun su id
  getHeroImage(heroId: string): string {
    return this.artworkService.cardPath(heroId);
  }
}