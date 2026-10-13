import { Injectable } from '@nestjs/common';
import { GameApiService } from '../../basic/game-api.service';
import { GameFeatureApiService } from '../../basic/game-feature-api.service';
import { ApplicationContextService } from '../../basic/services/application-context.service';
import { ErrorUtils } from '../../basic/error/error.utils';
import { AwardsModel, CompetitionStatisticsDataModel } from './model/awards.model';

@Injectable()
export class AwardsService {
  constructor(
    private readonly context: ApplicationContextService,
    private readonly api: GameApiService,
    private readonly game: GameFeatureApiService,
  ) {}

  async statistics(attemptId?: string): Promise<AwardsModel> {
    const teamId = this.context.getCurrentTeamId();
    const lang = this.context.language;
    try {
      const statistics = await this.api.get<CompetitionStatisticsDataModel>(
        `/teams/${teamId}/journeys/${attemptId ? encodeURIComponent(attemptId) : 'current'}/statistics`,
        { lang },
      );
      const [heroes, teams] = await Promise.all([
        this.game.heroes(lang),
        this.game.assignedTeams(lang),
      ]);
      return {
        ...statistics,
        configuredTeamId: teamId,
        heroNames: Object.fromEntries(heroes.heroes.map((hero) => [hero.id, hero.displayName])),
        teamNames: Object.fromEntries(teams.map((team) => [team.id, team.name])),
      };
    } catch (error) {
      ErrorUtils.mapGameApiError(
        error,
        {},
        {
          messageCode: 'AWARDS_UNAVAILABLE',
          message: 'No se pudieron cargar las estadísticas y los premios. Intentá nuevamente.',
        },
      );
    }
  }
}
