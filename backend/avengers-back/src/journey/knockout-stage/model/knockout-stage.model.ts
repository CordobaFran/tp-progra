import {
  KnockoutEncounterDamageApi,
  KnockoutEncounterResultApi,
  KnockoutEncountersApi,
  KnockoutEncounterSummaryApi,
  KnockoutMatchApi,
  KnockoutRoundApi,
  KnockoutStagesApi,
} from 'src/basic/model/game-api/journey.model';
import { FinalJourneyTeamApi } from '../../../basic/model/game-api/final-contract.model';

//TEAMS MODEL

export interface KnockoutTeamModel extends FinalJourneyTeamApi {
  isPlayerTeam?: boolean;
}

//STAGES MODELS

export interface KnockoutMatchModel extends KnockoutMatchApi {}
export interface KnockoutRoundModel extends KnockoutRoundApi {}
export interface KnockoutStagesModel extends KnockoutStagesApi {}

//ENCOUNTER MODELS

export interface KnockoutEncounterResultModel extends KnockoutEncounterResultApi {}
export interface KnockoutEncounterDamageModel extends KnockoutEncounterDamageApi {}
export interface KnockoutEncounterSummaryModel extends KnockoutEncounterSummaryApi {}
export interface KnockoutEncountersModel extends KnockoutEncountersApi {}

//KNOCKOUT MODEL

export interface KnockoutStageModel {
  teams: KnockoutTeamModel[];
  stages: KnockoutStagesModel;
  encounters: KnockoutEncountersModel;
}
