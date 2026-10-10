export type FinalStageStatus = 'READY' | 'ACTIVE' | 'COMPLETED';
export type FinalStagePhase = 'TOURNAMENT_FINAL' | 'DOOMSDAY' | 'FINAL_ATTACK' | 'COMPLETED';

export interface FinalStageStateApi {
  attemptId: string;
  status: FinalStageStatus;
  phase: FinalStagePhase;
  phaseLabel: string;
  normalTurn: number;
}

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

export interface FinalStageEventsApi {
  attemptId: string;
  language: 'en' | 'es';
  events: FinalStageEventApi[];
}
