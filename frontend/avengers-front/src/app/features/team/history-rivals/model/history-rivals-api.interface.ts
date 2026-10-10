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
