import { PageState } from '../../../../core/models/page-state.interface';
import { HistoryRivalsApi, HistoryRivalsEncountersApi } from './history-rivals-api.interface';

export const CURRENT_JOURNEY_ID = 'current';

export interface HistoryRivalsEncountersState extends PageState {
  data: HistoryRivalsEncountersApi | null;
}

export interface HistoryRivalsViewModel extends PageState {
  data: HistoryRivalsApi | null;
  lang: 'es' | 'en';
  selectedHeroId: string | null;
  selectedRivalId: string | null;
  selectedJourneyId: string | null;
  encounters: HistoryRivalsEncountersState;
}
