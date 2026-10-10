import { PageState } from '../../../../core/models/page-state.interface';
import { AppLanguage } from '../../../../core/services/i18n.service';

export type FinalStageStatus = 'READY' | 'ACTIVE' | 'COMPLETED';
export type FinalStagePhase = 'TOURNAMENT_FINAL' | 'DOOMSDAY' | 'FINAL_ATTACK' | 'COMPLETED';

export interface FinalStageEventValues {
  actorIdentityId?: string;
  actorHeroId?: string;
  actorSideCode?: string;
  targetHeroIds?: string[];
  targetId?: string;
  targetHeroId?: string;
  amount?: number;
  damage?: number;
  healing?: number;
  apChange?: number;
  abilityPoints?: number;
  energy?: number;
  actionName?: string;
  actionCode?: string;
  strategyCode?: string;
  itemName?: string;
  effectCode?: string;
  statCode?: string;
  targetSideCode?: string;
  revealedIdentityId?: string;
  previousIdentityId?: string;
  speakerTeamId?: string;
  playerTeamId?: string;
  opponentTeamId?: string;
  alignmentCode?: string;
  nextNormalTurn?: number;
  percent?: number;
  duration?: number;
}

export interface FinalStageNarrativeLine {
  lineSequence: number;
  type: 'NARRATION' | 'DIALOGUE';
  speakerId: string | null;
  text: string;
}

export interface FinalStageEventApi {
  sequence: number;
  turn: number;
  phase: FinalStagePhase;
  eventCode: string;
  messageCode: string;
  values: FinalStageEventValues;
  narrative: { lines: FinalStageNarrativeLine[] } | null;
}

export interface LiveEventModel extends FinalStageEventApi {
  actorName?: string;
  targetNames: string[];
}

export interface LiveEventsStateModel {
  status: FinalStageStatus | 'UNAVAILABLE';
  phase: FinalStagePhase | null;
  phaseLabel: string | null;
  events: LiveEventModel[];
}

export interface LiveEventsViewModel extends PageState {
  data: LiveEventsStateModel | null;
  lang: AppLanguage;
}
