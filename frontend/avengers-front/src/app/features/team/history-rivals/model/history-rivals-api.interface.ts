export interface HistoryRivalsRival {
  id: string;
  displayName: string;
}

export interface HistoryRivalsHero {
  id: string;
  displayName: string;
  leader: boolean;
  active: boolean;
  rivals: HistoryRivalsRival[];
}

export interface HistoryRivalsJourney {
  attemptId: string;
  completedAt: string;
  outcome: string;
  opponentFinalistName: string;
}

export interface HistoryRivalsApi {
  teamId: string;
  heroes: HistoryRivalsHero[];
  currentJourney: { attemptId: string; status: string } | null;
  completedJourneys: HistoryRivalsJourney[];
}

export type HistoryRivalsResult = 'WIN' | 'DRAW' | 'LOSS';

export interface HistoryRivalsTeam {
  id: string;
  name: string;
}

export interface HistoryRivalsEncounter {
  encounterId: string;
  stageCode: string;
  groupId: string | null;
  heroTeam: HistoryRivalsTeam;
  rivalTeam: HistoryRivalsTeam;
  winnerTeamId: string | null;
  heroTeamResult: HistoryRivalsResult | null;
  heroTeamDamage: number | null;
  rivalTeamDamage: number | null;
}

export interface HistoryRivalsEncountersApi {
  attemptId: string | null;
  encounters: HistoryRivalsEncounter[];
}
