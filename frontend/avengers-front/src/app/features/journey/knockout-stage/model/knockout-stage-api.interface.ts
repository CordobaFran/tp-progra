export interface KnockoutTeamApi {
  teamId: string;
  name: string;
  leaderId: string;
  heroIds: string[];
  strategyCode: string;
  heroes?: Array<{
    heroId: string;
    currentEnergy: number;
    currentAbilityPoints: number;
    status: string;
    knockedOut: boolean;
  }>;
  isPlayerTeam?: boolean;
}

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

export interface KnockoutStageApi {
  teams: KnockoutTeamApi[];
  stages: KnockoutStagesApi;
  encounters: KnockoutEncountersApi;
}
