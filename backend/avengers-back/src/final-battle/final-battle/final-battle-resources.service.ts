import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode } from '../../basic/error/error-code.enum';
import { ErrorUtils } from '../../basic/error/error.utils';
import { GameApiService } from '../../basic/game-api.service';
import { GameFeatureApiService } from '../../basic/game-feature-api.service';
import { FinalStrategyCatalogApi } from '../../basic/model/game-api/final-contract.model';
import { ApplicationContextService } from '../../basic/services/application-context.service';
import {
  FinalBattleResources,
  InventoryApi,
  PowerUpCatalogApi,
} from './model/final-battle-resources.model';

@Injectable()
export class FinalBattleResourcesService {
  constructor(
    private readonly context: ApplicationContextService,
    private readonly game: GameFeatureApiService,
    private readonly api: GameApiService,
  ) {}

  async getResources(attemptId: string): Promise<FinalBattleResources> {
    const teamId = this.context.getCurrentTeamId();
    const language = this.context.language;

    try {
      const [heroes, powerUps, strategies, currentTeams, inventory] = await Promise.all([
        this.game.heroes(language),
        this.api.get<PowerUpCatalogApi>('/reference/power-ups', { lang: language }),
        this.api.get<FinalStrategyCatalogApi>('/reference/strategies', { lang: language }),
        this.orNullWithoutJourney(() => this.game.currentTeams(teamId)),
        this.orNullWithoutJourney(() =>
          this.api.get<InventoryApi>(`/teams/${teamId}/journeys/current/inventory`),
        ),
      ]);

      return {
        attemptId,
        teamId,
        language,
        currentTeams,
        heroes: heroes.heroes,
        inventory,
        powerUps: powerUps.powerUps,
        strategies: strategies.strategies,
      };
    } catch (error: unknown) {
      ErrorUtils.mapGameApiError(
        error,
        {},
        {
          messageCode: ErrorCode.FINAL_STAGE_UNAVAILABLE,
          message: 'Unable to load the Final Battle resources.',
        },
      );
    }
  }

  private async orNullWithoutJourney<T>(request: () => Promise<T>): Promise<T | null> {
    try {
      return await request();
    } catch (error: unknown) {
      const details = ErrorUtils.extractExceptionDetails(error);
      if (
        details.statusCode === HttpStatus.CONFLICT &&
        details.messageCode === 'JOURNEY_REQUIRED'
      ) {
        return null;
      }
      throw error;
    }
  }
}
