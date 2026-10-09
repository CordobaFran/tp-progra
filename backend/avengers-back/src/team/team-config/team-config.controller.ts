import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { TeamConfigService } from './team-config.service';
import { CombatStrategy } from '../../basic/model/game-api/team-configuration.model';

@Controller('my-team/configuration')
export class TeamConfigController {
  constructor(private readonly configService: TeamConfigService) {}

  // [R3: Configurar Equipo] - Endpoint GET para obtener la configuración del equipo
  @Get(':teamId')
  async getConfiguration(@Param('teamId') teamId: string) {
    return await this.configService.getConfiguration(teamId);
  }

  // [R3: Configurar Equipo] - Endpoint PUT para guardar los cambios que hace el usuario
  @Put(':teamId')
  async saveConfiguration(
    @Param('teamId') teamId: string,
    @Body()
    datos: {
      leaderId: string;
      companionIds: string[];
      activeHeroIds: string[];
      strategy: CombatStrategy;
    },
  ) {
    return await this.configService.saveConfiguration(teamId, datos);
  }
}
