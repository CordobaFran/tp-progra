export type FinalStageStatus = 'READY' | 'ACTIVE' | 'COMPLETED';
export type FinalStagePhase = 'TOURNAMENT_FINAL' | 'DOOMSDAY' | 'FINAL_ATTACK' | 'COMPLETED';

export interface FinalStageStateApi {
  attemptId: string;
  status: FinalStageStatus;
  phase: FinalStagePhase;
  phaseLabel: string;
  normalTurn: number;
  variant: 'TOURNAMENT_FINAL' | 'DOOMSDAY' | 'COMPLETED';
  turnState: 'AWAITING_START' | 'AWAITING_PLAYER_ACTION' | 'COMPLETED';
  participants: { playerTeamId: string; opponentTeamId: string };
  completion: FinalStageCompletionApi | null;
  doom?: FinalStageDoomApi;
  opponentAlignmentCode?: string;
  revealEventSequence?: number;
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

export type FinalStageOutcome = 'VICTORY' | 'DEFEAT' | 'ABANDON';

export interface FinalStageCompletionApi {
  outcomeCode: FinalStageOutcome;
  endingCode: string;
  terminalReasonCode: string | null;
  endingEventSequences: number[];
}

export interface FinalStageDoomApi {
  narrativeCharacterId: string;
  maximumEnergy: number;
  currentEnergy: number;
  threatLevelCode: string;
}

export interface FinalStageHeroApi {
  heroId: string;
  status: 'ACTIVE' | 'INACTIVE';
  condition: 'AVAILABLE' | 'KNOCKED_OUT';
  maximumEnergy: number;
  currentEnergy: number;
  maximumAbilityPoints: number;
  currentAbilityPoints: number;
  returnAtTurn: number;
}

export interface FinalStageTeamApi {
  teamId: string;
  leaderId: string;
  strategyCode: string;
  heroes: FinalStageHeroApi[];
  vacantActiveHeroIds: string[];
  synergyCode: string;
  teamActionsRemaining: number;
  leaderAbilityUsesRemaining: number;
  strategyChangesRemaining: number;
}

export interface FinalStageTeamsApi {
  attemptId: string;
  variant: 'TOURNAMENT_FINAL' | 'DOOMSDAY' | 'COMPLETED';
  player: FinalStageTeamApi;
  opponent: FinalStageTeamApi;
  doom?: FinalStageDoomApi;
}

export interface FinalStageActionApi {
  actionId: string;
  actionCode: string;
  label: string;
  description: string;
  actorHeroId?: string;
  abilityId?: string;
  itemId?: string;
  strategyCode?: string;
  roleCombination?: string;
  outgoingHeroId?: string;
  incomingHeroId?: string;
  target: {
    targetType: 'HERO' | 'TEAM' | 'ANTAGONIST';
    targetId: string;
    sideCode: 'PLAYER' | 'OPPONENT' | 'DOOM';
  } | null;
  cost: { abilityPoints: number };
}

export interface FinalStageActionsApi {
  attemptId: string;
  phase: FinalStagePhase;
  normalTurn: number;
  language: 'es' | 'en';
  actions: FinalStageActionApi[];
}

export type FinalStageCommandApi =
  | { type: 'START' }
  | { type: 'CHOOSE_ACTION'; actionId: string }
  | { type: 'ABANDON' };

export interface FinalStageReceiptApi {
  phase: FinalStagePhase;
  normalTurn: number;
  status: FinalStageStatus;
  completionOutcome: FinalStageOutcome | null;
  endingCode: string | null;
  terminalReasonCode: string | null;
  emittedEvents: FinalStageEventApi[];
  nextDecisionRequired: boolean;
}
