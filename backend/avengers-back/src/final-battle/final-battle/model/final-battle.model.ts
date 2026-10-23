import {
  FinalHeroApi,
  FinalJourneyTeamApi,
  FinalStrategyApi,
  FinalStrategyCatalogApi,
} from '../../../basic/model/game-api/final-contract.model';
import {
  FinalStageStateApi,
  FinalStageTeamsApi,
  FinalStageActionApi,
  FinalStageEventApi,
  FinalStageReceiptApi,
} from '../../shared/model/final-stage-api.model';
import { InventoryEntryApi, PowerUpApi } from './final-battle-resources.model';

export interface FinalBattleTeamModel extends FinalJourneyTeamApi {
  heroProfiles: FinalHeroApi[];
}

export interface FinalBattleInventoryModel extends InventoryEntryApi {
  definition: PowerUpApi;
}

export interface FinalBattleModel {
  state: FinalStageStateApi | null;
  teams: FinalStageTeamsApi | null;
  player: FinalBattleTeamModel | null;
  opponent: FinalBattleTeamModel | null;
  actions: FinalStageActionApi[];
  events: FinalStageEventApi[];
  inventory: FinalBattleInventoryModel[];
  strategies: FinalStrategyApi[] | null;
  receipt?: FinalStageReceiptApi;
}
