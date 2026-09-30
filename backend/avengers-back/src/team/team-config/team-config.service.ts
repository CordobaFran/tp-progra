import { Injectable } from '@nestjs/common';
import { GameFeatureApiService } from '../../basic/game-feature-api.service';
import { CombatStrategy } from '../../basic/model/game-api/team-configuration.model';

@Injectable()
export class TeamConfigService {
  constructor(private readonly gameApi: GameFeatureApiService) {}

  // [R3: Configurar Equipo] - Obtiene (get) la configuración actual del equipo de la Game API
  async getConfiguration(teamId: string) {
    return await this.gameApi.configuration(teamId);
  }

  // [R3: Configurar Equipo] - Guarda (put) la configuración elegida por el usuario
  async saveConfiguration(
    teamId: string,
    datos: {
      leaderId: string;
      companionIds: string[];
      activeHeroIds: string[];
      strategy: CombatStrategy;
    },
  ) {
    // Calculamos los inactivos: son todos los miembros del equipo (líder + acompañantes) que NO están activos
    const allHeroIds = [datos.leaderId, ...datos.companionIds];
    const inactiveHeroIds = allHeroIds.filter(
      (id) => !datos.activeHeroIds.includes(id),
    );

    // Llamamos al metodo PUT que creamos en GameFeatureApiService
    return await this.gameApi.saveConfiguration(teamId, {
      leaderId: datos.leaderId,
      companionIds: datos.companionIds,
      activeHeroIds: datos.activeHeroIds,
      inactiveHeroIds,
      strategyCode: datos.strategy,
    });
  }
}