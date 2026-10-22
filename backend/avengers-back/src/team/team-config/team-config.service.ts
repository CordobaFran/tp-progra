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

    // Llamamos al método PUT enviando la whitelist exacta que exige la Game API
    return await (this.gameApi.saveConfiguration as any)(teamId, {
      companionIds: companionIds,
      activeHeroIds: activeHeroIds,
      strategy: datos.strategy || 'BALANCED',
    });
  }
}
