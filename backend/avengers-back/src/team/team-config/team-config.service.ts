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

    // Calculamos los inactivos: miembros del equipo (líder + acompañantes) que NO están activos
    const allHeroIds = [datos.leaderId, ...companionIds];
    const inactiveHeroIds = allHeroIds.filter((id) => !activeHeroIds.includes(id));

    // Llamamos al método PUT de GameFeatureApiService con la estructura exacta que espera
    return await this.gameApi.saveConfiguration(teamId, {
      leaderId: datos.leaderId,
      companionIds: companionIds,
      activeHeroIds: activeHeroIds,
      inactiveHeroIds: inactiveHeroIds,
      strategyCode: datos.strategy as unknown as string,
    });
  }
}
