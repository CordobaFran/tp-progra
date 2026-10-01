import { Injectable, HttpStatus } from '@nestjs/common';
import { ApplicationContextService } from '../../basic/services/application-context.service';
import { GameApiService } from '../../basic/game-api.service';
import { ErrorUtils } from '../../basic/error/error.utils';
import { ErrorCode } from '../../basic/error/error-code.enum';
import { FinalStageEventsApi, FinalStageStateApi } from './model/final-stage-api.model';

// Shared read gateway for R9/R10. R9 commands remain the responsibility of R9.
@Injectable()
export class FinalStageService {
  constructor(
    private readonly context: ApplicationContextService,
    private readonly api: GameApiService,
  ) {}

  async getState(): Promise<FinalStageStateApi | null> {
    try {
      return await this.api.get<FinalStageStateApi>(this.path(), { lang: this.context.language });
    } catch (error: unknown) {
      const details = ErrorUtils.extractExceptionDetails(error);
      // currentAttemptId() explicitly publishes JOURNEY_REQUIRED (409) when absent.
      // Generic 404s, invalid Teams and transport failures are consultation errors.
      if (
        details.statusCode === HttpStatus.CONFLICT &&
        details.messageCode === 'JOURNEY_REQUIRED'
      ) {
        return null;
      }
      this.mapError(error);
    }
  }

  async getEvents(): Promise<FinalStageEventsApi> {
    try {
      return await this.api.get<FinalStageEventsApi>(`${this.path()}/events`, {
        lang: this.context.language,
      });
    } catch (error: unknown) {
      this.mapError(error);
    }
  }

  private path(): string {
    return `/teams/${this.context.getCurrentTeamId()}/journeys/current/final-stage`;
  }

  private mapError(error: unknown): never {
    return ErrorUtils.mapGameApiError(
      error,
      {},
      {
        messageCode: ErrorCode.FINAL_STAGE_UNAVAILABLE,
        message: 'Unable to query the current Final Stage.',
      },
    );
  }
}
