import { PageState } from 'src/app/core/models/page-state.interface';
import { KnockoutStageApi } from './knockout-stage-api.interface';
import { KnockoutStageCodeEnum } from './knockout-stage-code.enum';

export interface KnockoutStageViewModel extends PageState {
  data: KnockoutStageApi | null;
  selectedStage: KnockoutStageCodeEnum;
}
