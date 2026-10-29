import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/basic/error/error-code.enum';
import { ApiErrorMappingRule, ApiErrorStatusMap, ErrorUtils } from 'src/basic/error/error.utils';
import { GameFeatureApiService } from 'src/basic/game-feature-api.service';
import { ApplicationContextService } from 'src/basic/services/application-context.service';
import { HistoryModel } from './model/history.model';

const HISTORY_API_ERROR_STATUS_MAP: ApiErrorStatusMap = {
  [HttpStatus.NOT_FOUND]: {
    messageCode: ErrorCode.JOURNEY_UNAVAILABLE,
    message: 'History is not available right now.',
  },
  [HttpStatus.CONFLICT]: {
    messageCode: ErrorCode.JOURNEY_UNAVAILABLE,
    message: 'History is not available right now.',
  },
};

const HISTORY_API_ERROR_FALLBACK: ApiErrorMappingRule = {
  messageCode: ErrorCode.JOURNEY_UNAVAILABLE,
  message: 'Unable to load the History right now.',
};
@Injectable()
export class HistoryService {
  private readonly teamId = this.appContext.getCurrentTeamId();
  
  constructor(
    private readonly game : GameFeatureApiService,
    private readonly appContext : ApplicationContextService
  ) {}

  async getHistoryList(lang: string){
    
    try {

      const response = await this.game.history(this.teamId, lang)
      return response;
      
    } catch (error) {
      ErrorUtils.mapGameApiError(
        error,
        HISTORY_API_ERROR_STATUS_MAP,
        HISTORY_API_ERROR_FALLBACK
      )
    }
  }
  
  async getHistoryDetail(attemptId: string, lang:string){
    try {

      const [summary, teamsResponse, eventsResponse, statistics] = await Promise.all(
        [
          this.game.historyJourneyDetail(this.teamId, attemptId, lang),
          this.game.historyTeamsDetail(this.teamId, attemptId, lang),
          this.game.historyEventsDetail(this.teamId, attemptId, lang),
          this.game.historyStatistics(this.teamId, attemptId, lang),
        ]
      )

      const result : HistoryModel = {
        attemptId,
        summary,
        teams: teamsResponse.teams,
        events: eventsResponse.events,
        statistics
      }

      return result;

    } catch (error) {
      ErrorUtils.mapGameApiError(
        error,
        HISTORY_API_ERROR_STATUS_MAP,
        HISTORY_API_ERROR_FALLBACK
      )      
    }
  }
}
