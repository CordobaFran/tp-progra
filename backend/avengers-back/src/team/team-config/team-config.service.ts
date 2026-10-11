import { Injectable } from '@nestjs/common';
import { GameFeatureApiService } from '../../basic/game-feature-api.service';
import { CombatStrategy } from '../../basic/model/game-api/team-configuration.model';

@Injectable()
export class TeamConfigService {
  constructor(private readonly gameApi: GameFeatureApiService) {}

  // [R3: Configurar Equipo] - obtiene (get) la configuración actual del equipo de la Game API
  async getConfiguration(teamId: string) {
    return await this.gameApi.configuration(teamId);
  }

  // [R3: Configurar Equipo] - guarda (put) la configuración elegida por el usuario
  async saveConfiguration(
    teamId: string,
    datos: {
      leaderId: string;
      companionIds: string[];
      activeHeroIds: string[];
      strategy: CombatStrategy;
    },
  ) {
    // protegemos los arrays para evitar fallos de iteración si vienen undefined
    const companionIds = datos.companionIds || [];
    const activeHeroIds = datos.activeHeroIds || [];

    // Calculamos los inactivos: son todos los miembros del equipo (líder + acompañantes) que NO están activos
    const allHeroIds = [datos.leaderId, ...companionIds];
    const inactiveHeroIds = allHeroIds.filter((id) => !activeHeroIds.includes(id));

    // Llamamos al método PUT que creamos en GameFeatureApiService
    // la GameAPI valida de forma estricta y solo acepta companionIds, activeHeroIds y strategy (los inactivos se deducen automáticamente)
    return await this.gameApi.saveConfiguration(teamId, {
      companionIds: companionIds,
      activeHeroIds: activeHeroIds,
      strategy: datos.strategy,
    } as any);
  }
}

