import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiErrorMappingRule, ApiErrorStatusMap, ErrorUtils } from '../../basic/error/error.utils';
import { ErrorCode } from '../../basic/error/error-code.enum';
import { GameFeatureApiService } from '../../basic/game-feature-api.service';
import { ApplicationContextService } from '../../basic/services/application-context.service';
import { HistoryRivalsModel } from './model/history-rivals.model';

const HISTORY_RIVALS_API_ERROR_STATUS_MAP: ApiErrorStatusMap = {
  [HttpStatus.NOT_FOUND]: {
    messageCode: ErrorCode.HISTORY_RIVALS_UNAVAILABLE,
    message: 'History and Rivals are not available right now.',
  },
  [HttpStatus.CONFLICT]: {
    messageCode: ErrorCode.HISTORY_RIVALS_UNAVAILABLE,
    message: 'History and Rivals are not available right now.',
  },
};

const HISTORY_RIVALS_API_ERROR_FALLBACK: ApiErrorMappingRule = {
  messageCode: ErrorCode.HISTORY_RIVALS_UNAVAILABLE,
  message: 'Unable to load History and Rivals right now.',
};

@Injectable()
export class HistoryRivalsService {
  constructor(
    private readonly context: ApplicationContextService,
    private readonly game: GameFeatureApiService,
  ) {}

  async getHistoryRivals(): Promise<HistoryRivalsModel> {
    const teamId = this.context.getCurrentTeamId();
    const language = this.context.language;

    try {
      const [configuration, catalog, relationCatalog, current, history] = await Promise.all([
        this.game.configuration(teamId),
        this.game.heroes(language),
        this.game.relationships([]),
        this.game.currentJourney(teamId, language),
        this.game.history(teamId, language),
      ]);
      const team = configuration.configuration;
      const teamHeroIds = team ? [team.leaderId, ...team.companionIds] : [];
      const heroNames = new Map(catalog.heroes.map((hero) => [hero.id, hero.displayName]));

      return {
        teamId,
        heroes: teamHeroIds.map((heroId) => ({
          id: heroId,
          displayName: heroNames.get(heroId) ?? heroId,
          leader: heroId === team?.leaderId,
          active: team?.activeHeroIds.includes(heroId) ?? false,
          rivals: relationCatalog.relationships
            .filter(
              (relationship) =>
                relationship.relationship === 'RIVAL' &&
                (relationship.heroAId === heroId || relationship.heroBId === heroId),
            )
            .map((relationship) =>
              relationship.heroAId === heroId ? relationship.heroBId : relationship.heroAId,
            )
            .map((rivalId) => ({ id: rivalId, displayName: heroNames.get(rivalId) ?? rivalId })),
        })),
        currentJourney: current.attempt
          ? { attemptId: current.attempt.id, status: current.attempt.status }
          : null,
        completedJourneys: history.items.map((item) => ({
          attemptId: item.attemptId,
          completedAt: item.completedAt,
          outcome: item.outcomeCode,
          opponentFinalistName: item.opponentFinalistName,
        })),
      };
    } catch (error) {
      ErrorUtils.mapGameApiError(
        error,
        HISTORY_RIVALS_API_ERROR_STATUS_MAP,
        HISTORY_RIVALS_API_ERROR_FALLBACK,
      );
    }
  }
}
