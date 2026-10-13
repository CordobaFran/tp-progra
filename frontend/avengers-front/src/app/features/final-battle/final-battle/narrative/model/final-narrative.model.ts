import { PageState } from '../../../../../core/models/page-state.interface';
import { AppLanguage } from '../../../../../core/services/i18n.service';
import {
  FinalStageStatus,
  FinalStagePhase,
  FinalStageEventApi,
} from '../../../live-events/model/live-events.model';

export {
  FinalStageEventApi,
  FinalStageEventValues,
} from '../../../live-events/model/live-events.model';

export interface FinalNarrativeStateModel {
  status: FinalStageStatus;
  phase: FinalStagePhase;
  phaseLabel: string;
  normalTurn: number;
}

export interface FinalNarrativeViewModel extends PageState {
  lang: AppLanguage;
  state: FinalNarrativeStateModel | null;
  events: FinalStageEventApi[];
}
