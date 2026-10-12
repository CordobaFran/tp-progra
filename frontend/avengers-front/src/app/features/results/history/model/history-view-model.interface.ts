import { PageState } from 'src/app/core/models/page-state.interface';

export interface HistoryItem {
  attemptId: string;
  spendingStrategyCode: string;
  outcomeCode: string | null;
  endingSummary: string | null;
}

export interface HistoryListResponse {
  items: HistoryItem[];
}

export interface HistoryViewModel extends PageState {
  data: HistoryItem[] | null;
  lang: 'es' | 'en';
}