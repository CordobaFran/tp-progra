import { HttpStatus, Injectable } from '@nestjs/common';
import { GameFeatureApiService } from '../../basic/game-feature-api.service';
import { ApplicationContextService } from '../../basic/services/application-context.service';
import { KnockoutStageModel, KnockoutTeamModel } from './model/knockout-stage.model';
import { ApiErrorMappingRule, ApiErrorStatusMap, ErrorUtils } from '../../basic/error/error.utils';
import { ErrorCode } from '../../basic/error/error-code.enum';

const KNOCKOUT_STAGE_API_ERROR_STATUS_MAP: ApiErrorStatusMap = {
  [HttpStatus.NOT_FOUND]: {
    messageCode: ErrorCode.KNOCKOUT_STAGE_UNAVAILABLE,
    message: 'Knockout stage is not available right now.',
  },
  [HttpStatus.CONFLICT]: {
    messageCode: ErrorCode.KNOCKOUT_STAGE_UNAVAILABLE,
    message: 'Knockout stage is not available right now.',
  },
};

const KNOCKOUT_STAGE_API_ERROR_FALLBACK: ApiErrorMappingRule = {
  messageCode: ErrorCode.KNOCKOUT_STAGE_UNAVAILABLE,
  message: 'Unable to load the Knockout stage right now.',
};

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

      const teams: KnockoutTeamModel[] = (teamsData.teams ?? []).map((team) => ({
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
      ErrorUtils.mapGameApiError(
        error,
        KNOCKOUT_STAGE_API_ERROR_STATUS_MAP,
        KNOCKOUT_STAGE_API_ERROR_FALLBACK,
      );
    }
  }
}
