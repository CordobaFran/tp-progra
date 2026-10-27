import { PageState } from 'src/app/core/models/page-state.interface';

export interface HistoryItem {
  attemptId: string;
  spendingStrategyCode: string;
  outcomeCode: string | null;
  endingSummary: string | null;
}
export interface HistorySummary {
  attemptId: string;
  teamId: string;
  status: string;
  spendingStrategyCode: string;
  createdAt: string;
  completedAt: string | null;
  configuration: {
    leaderId: string;
    companionIds: string[];
    activeHeroIds: string[];
    inactiveHeroIds: string[];
    strategyCode: string;
  };
  finalists: {
    playerTeamId: string;
    opponentTeamId: string;
  } | null;
  progress: {
    stagesCompleted: number;
    encountersPlayedByPlayer: number;
    finalStageStatus: string;
  };
  completionOutcome: string | null;
  terminalReasonCode: string | null;
}

export interface HistoryTeam {
  teamId: string;
  name: string;
  leaderId: string;
  heroIds: string[];
  strategyCode?: string;
  rewardPoints?: number;
  eliminated?: boolean;
}

export interface HistoryEvent {
  sequence: number;
  eventCode: string;
  stageCode: string;
  encounterId: string | null;
}

export interface HistoryStatistics {
  attemptId: string;
  status: string;
  completionOutcome: string | null;
  competition: {
    journeyEncounters: number;
    finalStagePlayed: boolean;
    finalStageNormalTurnsPlayed: number;
  };
}

export interface HistoryListResponse {
  items: HistoryItem[];
}
export interface HistoryDetailResponse {
  attemptId: string;
  summary: HistorySummary;
  teams: HistoryTeam[];
  events: HistoryEvent[];
  statistics: HistoryStatistics;
}
export interface HistoryViewModel extends PageState {
  data: HistoryItem[] | null;
  selectedDetail: HistoryDetailResponse | null;
  viewMode: 'list' | 'detail';
  lang: 'es' | 'en';
}