import { PageState } from '../../../../core/models/page-state.interface';
import { HistoryRivalsApi } from './history-rivals-api.interface';

export interface HistoryRivalsViewModel extends PageState {
  data: HistoryRivalsApi | null;
  lang: 'es' | 'en';
}
