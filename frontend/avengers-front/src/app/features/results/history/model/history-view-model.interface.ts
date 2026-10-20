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
export interface HistoryDetailResponse {
  attemptId: string;
  summary: any;
  teams: any;
  events: any;
  statistics: any;
}
export interface HistoryViewModel extends PageState {
  data: HistoryItem[] | null;
  selectedDetail: HistoryDetailResponse | null;
  viewMode: 'list' | 'detail';
  lang: 'es' | 'en';
}