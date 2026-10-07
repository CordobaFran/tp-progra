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
