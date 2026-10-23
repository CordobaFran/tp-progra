import { BadGatewayException, HttpException, Injectable } from '@nestjs/common';
import { FinalStageService } from '../shared/final-stage.service';
import {
  FinalStageActionsApi,
  FinalStageCommandApi,
  FinalStageEventApi,
  FinalStageEventsApi,
  FinalStageStateApi,
  FinalStageTeamsApi,
} from '../shared/model/final-stage-api.model';
import { FinalBattleResourcesService } from './final-battle-resources.service';
import {
  FinalBattleInventoryModel,
  FinalBattleModel,
  FinalBattleTeamModel,
} from './model/final-battle.model';
import { FinalBattleResources } from './model/final-battle-resources.model';
import { ErrorUtils } from '../../basic/error/error.utils';
import { ErrorCode } from '../../basic/error/error-code.enum';

@Injectable()
export class FinalBattleService {
  constructor(
    private readonly finalStage: FinalStageService,
    private readonly resources: FinalBattleResourcesService,
  ) {}

  getState(): Promise<FinalStageStateApi | null> {
    return this.finalStage.getState();
  }

  getEvents(): Promise<FinalStageEventsApi> {
    return this.finalStage.getEvents();
  }

  async getBattle(): Promise<FinalBattleModel> {
    try {
      const state = await this.getState();
      if (state === null) {
        return {
          state: null,
          teams: null,
          player: null,
          opponent: null,
          actions: [],
          events: [],
          inventory: [],
          strategies: null,
        };
      }
      if (!['READY', 'ACTIVE', 'COMPLETED'].includes(state.status)) {
        throw new BadGatewayException('Invalid Final Stage status.');
      }
      const [teams, actions, events, resources] = await Promise.all([
        state.status === 'READY' ? Promise.resolve(null) : this.finalStage.getTeams(),
        state.status === 'ACTIVE' ? this.finalStage.getActions() : Promise.resolve(null),
        this.getEvents(),
        this.resources.getResources(state.attemptId),
      ]);
      this.validateSnapshot(state, teams, actions, events, resources);
      return {
        state,
        teams,
        player: this.composeTeam(state.participants.playerTeamId, resources),
        opponent: this.composeTeam(state.participants.opponentTeamId, resources),
        actions: actions?.actions ?? [],
        events: this.orderEvents(events.events),
        inventory: this.composeInventory(resources),
        strategies: {
          language: resources.strategies[0]?.language,
          strategies: resources.strategies.strategies,
          compatibility: resources.strategies.compatibility,
        },
      };
    } catch (error: unknown) {
      ErrorUtils.mapGameApiError(
        error,
        {},
        {
          messageCode: ErrorCode.FINAL_STAGE_UNAVAILABLE,
          message: 'Unable to load the Final Battle.',
        },
      );
    }
  }

  async play(command: FinalStageCommandApi): Promise<FinalBattleModel> {
    const receipt = await this.finalStage.play(command);
    try {
      const battle = await this.getBattle();
      const state = battle.state;
      if (
        state === null ||
        state.status !== receipt.status ||
        state.phase !== receipt.phase ||
        state.normalTurn !== receipt.normalTurn ||
        (state.completion?.outcomeCode ?? null) !== receipt.completionOutcome ||
        (state.completion?.endingCode ?? null) !== receipt.endingCode ||
        (state.completion?.terminalReasonCode ?? null) !== receipt.terminalReasonCode
      ) {
        throw new BadGatewayException('The reloaded Final Stage does not match the receipt.');
      }
      return { ...battle, receipt };
    } catch {
      throw new HttpException(
        {
          responseMessage: {
            messageCode: 'BFF_FINAL_STAGE_REFRESH_FAILED',
            message:
              'The command succeeded, but reloading failed. Query the battle before sending another command.',
          },
          data: null,
        },
        502,
      );
    }
  }

  private validateSnapshot(
    state: FinalStageStateApi,
    teams: FinalStageTeamsApi | null,
    actions: FinalStageActionsApi | null,
    events: FinalStageEventsApi,
    resources: FinalBattleResources,
  ): void {
    const attempts = [
      events.attemptId,
      resources.currentTeams.attemptId,
      resources.inventory.attemptId,
      ...(teams ? [teams.attemptId] : []),
      ...(actions ? [actions.attemptId] : []),
    ];
    if (attempts.some((id) => id !== state.attemptId)) {
      throw new BadGatewayException('Journey changed during the query. Reload the Final Battle.');
    }
    if (actions && (actions.phase !== state.phase || actions.normalTurn !== state.normalTurn)) {
      throw new BadGatewayException(
        'Final Stage changed during the query. Reload the Final Battle.',
      );
    }
    if (
      teams &&
      (teams.variant !== state.variant ||
        teams.player.teamId !== state.participants.playerTeamId ||
        teams.opponent.teamId !== state.participants.opponentTeamId)
    ) {
      throw new BadGatewayException('Final Teams do not match the current Final Stage.');
    }
  }

  private orderEvents(events: FinalStageEventApi[]): FinalStageEventApi[] {
    return [...events]
      .sort((a, b) => a.sequence - b.sequence)
      .map((event) => ({
        ...event,
        narrative:
          event.narrative === null
            ? null
            : {
                lines: [...event.narrative.lines].sort((a, b) => a.lineSequence - b.lineSequence),
              },
      }));
  }

  private composeInventory(resources: FinalBattleResources): FinalBattleInventoryModel[] {
    return resources.inventory.items.map((item) => {
      const definition = resources.powerUps.find((powerUp) => powerUp.id === item.itemId);
      if (!definition) {
        throw new BadGatewayException('An inventory item has no public definition.');
      }
      return { ...item, definition };
    });
  }

  private composeTeam(teamId: string, resources: FinalBattleResources): FinalBattleTeamModel {
    const team = resources.currentTeams.teams.find((entry) => entry.teamId === teamId);
    if (!team) {
      throw new BadGatewayException('A Final participant is missing from the public Teams.');
    }
    const heroProfiles = team.heroIds.map((heroId) => {
      const hero = resources.heroes.find((entry) => entry.id === heroId);
      if (!hero) {
        throw new BadGatewayException('A Team Hero is missing from the public catalog.');
      }
      return hero;
    });
    return {
      ...team,
      heroProfiles: heroProfiles as unknown as FinalBattleTeamModel['heroProfiles'],
    };
  }
}
