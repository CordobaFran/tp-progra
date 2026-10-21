export interface HistoryRivalsRivalModel {
  id: string;
  displayName: string;
}

export interface HistoryRivalsHeroModel {
  id: string;
  displayName: string;
  leader: boolean;
  active: boolean;
  rivals: HistoryRivalsRivalModel[];
}

export interface HistoryRivalsJourneyModel {
  attemptId: string;
  completedAt: string;
  outcome: string;
  opponentFinalistName: string;
}

export interface HistoryRivalsModel {
  teamId: string;
  heroes: HistoryRivalsHeroModel[];
  currentJourney: { attemptId: string; status: string } | null;
  completedJourneys: HistoryRivalsJourneyModel[];
}

export interface HistoryRivalsTeamModel {
  id: string;
  name: string;
}

export interface HistoryRivalsEncounterModel {
  encounterId: string;
  stageCode: string;
  groupId: string | null;
  heroTeam: HistoryRivalsTeamModel;
  rivalTeam: HistoryRivalsTeamModel;
  winnerTeamId: string | null;
  heroTeamResult: 'WIN' | 'DRAW' | 'LOSS' | null;
  heroTeamDamage: number | null;
  rivalTeamDamage: number | null;
}

export interface HistoryRivalsEncountersModel {
  attemptId: string | null;
  encounters: HistoryRivalsEncounterModel[];
}
