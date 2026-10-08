import {
  FinalStageEventApi,
  FinalStagePhase,
  FinalStageStatus,
} from '../../shared/model/final-stage-api.model';

export interface LiveEventModel extends FinalStageEventApi {
  actorName?: string;
  targetNames: string[];
}

export interface LiveEventsStateModel {
  status: FinalStageStatus | 'UNAVAILABLE';
  phase: FinalStagePhase | null;
  phaseLabel: string | null;
  events: LiveEventModel[];
}
