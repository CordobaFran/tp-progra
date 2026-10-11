import { Injectable } from '@nestjs/common';
import { GameFeatureApiService } from 'src/basic/game-feature-api.service';
import { ApplicationContextService } from 'src/basic/services/application-context.service';
import { KnockoutStageModel, KnockoutTeamModel } from './model/knockout-stage.model';

@Injectable()
export class KnockoutStageService {
  constructor(
    private readonly context: ApplicationContextService,
    private readonly game: GameFeatureApiService,
  ) {}

  async getKnockoutStage(): Promise<KnockoutStageModel> {
    const teamId = this.context.getCurrentTeamId();
    try {
      const [teamsData, stages, encounters] = await Promise.all([
        this.game.currentTeams(teamId),
        this.game.knockoutStages(teamId),
        this.game.knockoutEncounters(teamId),
      ]);

      const teams: KnockoutTeamModel[] = teamsData.teams.map((team) => ({
        ...team,
        isPlayerTeam: team.teamId === teamId,
      }));
      const result: KnockoutStageModel = {
        teams,
        stages,
        encounters,
      };
      return result;
    } catch (error) {
      //Implementar manejo de errores
      throw error;
    }
  }
}
