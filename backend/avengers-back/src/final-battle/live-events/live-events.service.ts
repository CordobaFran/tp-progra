import { BadGatewayException, Injectable } from '@nestjs/common';
import { ApplicationContextService } from '../../basic/services/application-context.service';
import { GameFeatureApiService } from '../../basic/game-feature-api.service';
import { ErrorUtils } from '../../basic/error/error.utils';
import { ErrorCode } from '../../basic/error/error-code.enum';
import { FinalStageService } from '../shared/final-stage.service';
import { LiveEventsStateModel } from './model/live-events.model';

@Injectable()
export class LiveEventsService {
  constructor(
    private readonly context: ApplicationContextService,
    private readonly finalStage: FinalStageService,
    private readonly gameFeatureApi: GameFeatureApiService,
  ) {}

  async getLiveEvents(): Promise<LiveEventsStateModel> {
    try {
      const state = await this.finalStage.getState();
      if (state === null) {
        return { status: 'UNAVAILABLE', phase: null, phaseLabel: null, events: [] };
      }
      if (!['READY', 'ACTIVE', 'COMPLETED'].includes(state.status)) {
        throw new BadGatewayException('Invalid Final Stage status.');
      }
      const response = await this.finalStage.getEvents();
      if (!Array.isArray(response.events) || response.attemptId !== state.attemptId) {
        throw new BadGatewayException(
          'Invalid or inconsistent Final Stage events. Refresh the record.',
        );
      }
      const names = new Map<string, string>();
      if (response.events.length) {
        const catalog = await this.gameFeatureApi.heroes(this.context.language);
        catalog.heroes.forEach((hero) => names.set(hero.id, hero.displayName));
      }
      const displayName = (id: string): string => names.get(id) ?? id;
      const events = [...response.events]
        .sort((a, b) => a.sequence - b.sequence)
        .map((event) => {
          const values = event.values;
          const actorId = values.actorHeroId ?? values.actorIdentityId ?? values.actorSideCode;
          const targetIds = [
            ...new Set([
              ...(values.targetHeroIds ?? []),
              ...[values.targetHeroId, values.targetId].filter((id): id is string => Boolean(id)),
            ]),
          ];
          if (!targetIds.length && values.targetSideCode) {
            targetIds.push(values.targetSideCode);
          }
          return {
            ...event,
            narrative:
              event.narrative === null
                ? null
                : {
                    lines: [...event.narrative.lines].sort(
                      (a, b) => a.lineSequence - b.lineSequence,
                    ),
                  },
            actorName: actorId ? displayName(actorId) : undefined,
            targetNames: targetIds.map(displayName),
          };
        });
      return { status: state.status, phase: state.phase, phaseLabel: state.phaseLabel, events };
    } catch (error: unknown) {
      ErrorUtils.mapGameApiError(
        error,
        {},
        {
          messageCode: ErrorCode.FINAL_STAGE_UNAVAILABLE,
          message: 'Unable to load Live Events right now.',
        },
      );
    }
  }
}
