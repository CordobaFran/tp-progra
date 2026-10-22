import { Component, OnInit } from '@angular/core';
import { TeamConfigService } from './service/team-config.service';
import { AppContextService } from '../../../core/services/app-context.service';
import { HeroArtworkResolverService } from '../../../core/services/hero-artwork-resolver.service';
import { TeamConfigResponse, UpdateTeamConfigRequest } from './model/team-config.interface';

interface HeroItem {
  id: string;
  displayName?: string;
  roles?: {
    primary?: {
      label?: string;
      code?: string;
    };
  };
}

interface TeamHeroesResponse {
  data?: {
    heroes?: HeroItem[];
  };
  heroes?: HeroItem[];
}

@Component({
  selector: 'app-team-config',
  templateUrl: './team-config.component.html',
  styleUrls: ['./team-config.component.css'],
  standalone: false,
})
export class TeamConfigComponent implements OnInit {
  configuracion?: TeamConfigResponse;

  heroes: HeroItem[] = [];

  teamId: string = '';

  catalogoHeroes: HeroItem[] = [];

  terminoBusqueda: string = '';

  constructor( // inyecté AppContextService para acceder al estado global de la aplicación (donde vive el teamId asignado)
    private readonly teamConfigService: TeamConfigService,
    private readonly appContextService: AppContextService,
    private readonly artworkService: HeroArtworkResolverService,
  ) {}

  ngOnInit(): void {
    // Verificamos directamente si el contexto y el teamId existen
    const resolvedTeamId = this.appContextService.current?.teamId || 'hulk';
    this.teamId = resolvedTeamId;

    // Consultamos la configuracion con el ID dinamico
    this.teamConfigService.getTeamConfiguration(this.teamId).subscribe((datos: TeamConfigResponse) => {
      console.log('Respuesta del backend:', datos);
      this.configuracion = datos;

    // Catálogo general de héroes disponibles 
    this.teamConfigService.getHeroesCatalog().subscribe({
      next: (resp: unknown) => {
        const parsed = resp as TeamHeroesResponse;
        this.catalogoHeroes = parsed?.data?.heroes ?? parsed?.heroes ?? (Array.isArray(resp) ? (resp as HeroItem[]) : []);
      },
      error: (err: unknown) => {
        console.error('Error al cargar catalogo:', err);
      },
    });

      // Traemos los héroes del equipo para armar la lista en la pantalla
      this.teamConfigService.getMyTeamHeroes().subscribe((resp: unknown) => {
        const parsedResp = resp as TeamHeroesResponse;
        const allHeroes: HeroItem[] = parsedResp?.data?.heroes ?? parsedResp?.heroes ?? (Array.isArray(resp) ? (resp as HeroItem[]) : []);

        const leader = this.configuracion?.configuration?.leaderId;
        const companions = this.configuracion?.configuration?.companionIds ?? [];
        const miembrosDelEquipo = [leader, ...companions].filter((id): id is string => !!id);

        if (miembrosDelEquipo.length > 0) {
          this.heroes = allHeroes.filter((h) => miembrosDelEquipo.includes(h.id));
        } else {
          this.heroes = allHeroes;
        }
      });
    });
  }

  // Devuelve la imagen del héroe segun su id
  getHeroImage(heroId: string): string {
    return this.artworkService.cardPath(heroId);
  }

  // Selección de Héroe - método
  seleccionarHeroe(heroId: string): void { // recibe como parámetro el ID del héroe que seleccionaste
    if (!this.configuracion?.configuration) { // si no devuelve nada o valores undefined, se frena, no se rompe
      return;
    }

    const leaderId = this.configuracion.configuration.leaderId;

    if (heroId === leaderId) {
      alert('El líder del equipo es titular fijo y no puede pasar a suplente.');
      return;
    }

    const activeIds: string[] = this.configuracion.configuration.activeHeroIds ?? [];

    if (leaderId && !activeIds.includes(leaderId)) {
      activeIds.push(leaderId);
    }

    const index = activeIds.indexOf(heroId);

    if (index > -1) { // condicional por si el heroe seleccionado era titular o suplente
      activeIds.splice(index, 1);
    } else {
      if (activeIds.length >= 3) {
        alert('Solo podés seleccionar 3 titulares en total (el Líder y 2 acompañantes).');
        return;
      }
      activeIds.push(heroId);
    }

    this.configuracion.configuration.activeHeroIds = [...activeIds];
  }

  // método para enviar los cambios al backend con el PUT
  guardarConfiguracion(): void {
    if (!this.teamId || !this.configuracion?.configuration) {
      return;
    }

    const config = this.configuracion.configuration;
    const activeIds = [...(config.activeHeroIds ?? [])];

    if (config.leaderId && !activeIds.includes(config.leaderId)) {
      activeIds.push(config.leaderId);
    }

    if (activeIds.length !== 3) {
      alert(`Debés seleccionar exactamente 3 titulares (actualmente tenés ${activeIds.length}).`);
      return;
    }

    const payload: UpdateTeamConfigRequest = {
      leaderId: config.leaderId,
      companionIds: config.companionIds ?? [],
      activeHeroIds: activeIds,
      strategy: config.strategy,
    };

    this.teamConfigService.updateTeamConfiguration(this.teamId, payload).subscribe({
      next: () => {
        alert('Configuración guardada con éxito');
      },
      error: (err: unknown) => {
        console.error('Error al guardar: ', err);
        alert('Error al guardar la configuración');
      },
    });
  }


// Filtra el catálogo en tiempo real según el texto ingresado
  get heroesFiltrados(): HeroItem[] {
    if (!this.terminoBusqueda.trim()) {
      return this.catalogoHeroes;
    }

    const busqueda = this.terminoBusqueda.toLowerCase();

    return this.catalogoHeroes.filter((h) => 
      (h.displayName?.toLowerCase().includes(busqueda) || h.id.toLowerCase().includes(busqueda))
    );
  }

  // Agregar o quitar acompañantes (máximo 5)
  alternarAcompaniante(heroId: string): void {
    if (!this.configuracion?.configuration) {
      return;
    }

    const config = this.configuracion.configuration;
    const leaderId = config.leaderId;

    if (heroId === leaderId) {
      alert('El líder no se puede modificar.');
      return;
    }

    let companions = [...(config.companionIds ?? [])];

    if (companions.includes(heroId)) {
      companions = companions.filter((id: string) => id !== heroId);
      config.activeHeroIds = (config.activeHeroIds ?? []).filter((id: string) => id !== heroId);
    } else {
      if (companions.length >= 5) {
        alert('El equipo ya tiene los 5 acompañantes máximos permitidos.');
        return;
      }
      companions.push(heroId);
    }

    config.companionIds = [...companions];

    const miembros = [leaderId, ...companions];
    this.heroes = this.catalogoHeroes.filter((h: HeroItem) => miembros.includes(h.id));
  }
}