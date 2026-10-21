import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiErrorMappingRule, ApiErrorStatusMap, ErrorUtils } from '../../basic/error/error.utils';
import { ErrorCode } from '../../basic/error/error-code.enum';
import { GameApiService } from '../../basic/game-api.service';
import { GameFeatureApiService } from '../../basic/game-feature-api.service';
import { FinalJourneyTeamsApi } from '../../basic/model/game-api/final-contract.model';
import { KnockoutEncountersApi } from '../../basic/model/game-api/journey.model';
import { ApplicationContextService } from '../../basic/services/application-context.service';
import { HistoryRivalsEncountersModel, HistoryRivalsModel } from './model/history-rivals.model';
import { HistoryRivalsEncountersRequest } from './request/history-rivals-encounters.request';

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
    private readonly api: GameApiService,
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

  async getEncounters(
    request: HistoryRivalsEncountersRequest,
  ): Promise<HistoryRivalsEncountersModel> {
    const journeyPath = request.attemptId
      ? `/teams/${this.context.getCurrentTeamId()}/journeys/${encodeURIComponent(request.attemptId)}`
      : `/teams/${this.context.getCurrentTeamId()}/journeys/current`;

    try {
      const [journeyTeams, journeyEncounters] = await Promise.all([
        this.api.get<FinalJourneyTeamsApi>(`${journeyPath}/teams`),
        this.api.get<KnockoutEncountersApi>(`${journeyPath}/encounters`),
      ]);
      const teams = new Map(journeyTeams.teams.map((team) => [team.teamId, team]));
      const hasHero = (teamId: string, heroId: string): boolean =>
        teams.get(teamId)?.heroIds.includes(heroId) ?? false;
      const teamModel = (teamId: string) => ({
        id: teamId,
        name: teams.get(teamId)?.name ?? teamId,
      });

      return {
        attemptId: journeyEncounters.attemptId,
        encounters: journeyEncounters.encounters.flatMap((encounter) => {
          const { teamAId, teamBId } = encounter;
          const heroTeamId =
            hasHero(teamAId, request.heroId) && hasHero(teamBId, request.rivalId)
              ? teamAId
              : hasHero(teamBId, request.heroId) && hasHero(teamAId, request.rivalId)
                ? teamBId
                : null;
          if (heroTeamId === null) {
            return [];
          }
          const rivalTeamId = heroTeamId === teamAId ? teamBId : teamAId;
          const damageOf = (teamId: string): number | null =>
            encounter.damageByTeam.find((damage) => damage.teamId === teamId)?.damageDealt ?? null;

          return [
            {
              encounterId: encounter.encounterId,
              stageCode: encounter.stageCode,
              groupId: encounter.groupId,
              heroTeam: teamModel(heroTeamId),
              rivalTeam: teamModel(rivalTeamId),
              winnerTeamId: encounter.winnerTeamId,
              heroTeamResult:
                encounter.results.find((result) => result.teamId === heroTeamId)?.resultCode ??
                null,
              heroTeamDamage: damageOf(heroTeamId),
              rivalTeamDamage: damageOf(rivalTeamId),
            },
          ];
        }),
      };
    } catch (error) {
      if (!request.attemptId && this.isJourneyRequired(error)) {
        return { attemptId: null, encounters: [] };
      }
      ErrorUtils.mapGameApiError(
        error,
        HISTORY_RIVALS_API_ERROR_STATUS_MAP,
        HISTORY_RIVALS_API_ERROR_FALLBACK,
      );
    }
  }

  private isJourneyRequired(error: unknown): boolean {
    const details = ErrorUtils.extractExceptionDetails(error);
    return details.statusCode === HttpStatus.CONFLICT && details.messageCode === 'JOURNEY_REQUIRED';
  }
}
