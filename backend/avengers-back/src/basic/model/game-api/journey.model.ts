export type JourneySpendingStrategy = 'SAVE' | 'BALANCED' | 'AGGRESSIVE';
export interface JourneySummaryApi {
  id: string;
  teamId: string;
  status: string;
  spendingStrategy?: JourneySpendingStrategy;
  finalistIds?: string[];
  stageCount: number;
  encounterCount: number;
}
export interface CurrentJourneyApi {
  teamId: string;
  attempt: JourneySummaryApi | null;
  summary: import('./final-contract.model').FinalJourneySummaryApi | null;
}
export interface SimulateJourneyApi {
  attemptId: string;
  teamId: string;
  status: string;
  spendingStrategy: JourneySpendingStrategy;
  opponentFinalistId: string;
  replacedPrevious: boolean;
}
export interface JourneyDetailApi {
  id: string;
  data: { teams: TournamentTeamApi[]; encounters: EncounterApi[]; finalistIds: string[] };
}
export interface TournamentTeamApi {
  id: string;
  name: string;
  leaderId: string;
  heroIds: string[];
  rewardPoints?: number;
  eliminated?: boolean;
}
export interface EncounterApi {
  id: string;
  stageType: string;
  teamAId: string;
  teamBId: string;
  resultByTeam: Record<string, 'WIN' | 'DRAW' | 'LOSS'>;
  rival: boolean;
}
export interface JourneyHistoryApi {
  page: number;
  pageSize: number;
  total: number;
  items: JourneyHistoryItemApi[];
}
export interface JourneyHistoryItemApi {
  id: string;
  spendingStrategy: JourneySpendingStrategy;
  outcome: string;
  opponentFinalistId: string;
  opponentFinalistName: string;
  completedAt: string;
}

//AGREGADO POR LEO

//stages

export interface KnockoutMatchApi {
  slot: number;
  encounterId: string;
  teamAId: string;
  teamBId: string;
  winnerTeamId: string;
  nextStageCode: 'QUARTERFINAL' | 'SEMIFINAL' | 'FINAL_STAGE';
  nextSlot: number;
}

export interface KnockoutRoundApi {
  stageCode: 'ROUND_OF_16' | 'QUARTERFINAL' | 'SEMIFINAL';
  matches: KnockoutMatchApi[];
}

export interface KnockoutFinalistsApi {
  playerTeamId: string;
  opponentTeamId: string;
}

export interface KnockoutStagesApi {
  attemptId: string;
  knockout: {
    rounds: KnockoutRoundApi[];
  };
  finalists: KnockoutFinalistsApi;
}

//encounters

export interface KnockoutEncounterResultApi {
  teamId: string;
  resultCode: 'WIN' | 'DRAW' | 'LOSS';
}

export interface KnockoutEncounterDamageApi {
  teamId: string;
  damageDealt: number;
}

export interface KnockoutEncounterSummaryApi {
  encounterId: string;
  stageId: string;
  stageCode: 'GROUP_STAGE' | 'ROUND_OF_16' | 'QUARTERFINAL' | 'SEMIFINAL';
  groupId: string | null;
  teamAId: string;
  teamBId: string;
  winnerTeamId: string | null;
  resolutionCode:
    | 'NORMAL'
    | 'TOTAL_KO'
    | 'SPECIAL_SHOWDOWN'
    | 'SHOWDOWN_FORFEIT'
    | 'TECHNICAL_VERDICT';
  rivalEncounter: boolean;
  results: KnockoutEncounterResultApi[];
  damageByTeam: KnockoutEncounterDamageApi[];
}

export interface KnockoutEncountersApi {
  attemptId: string;
  encounters: KnockoutEncounterSummaryApi[];
}
