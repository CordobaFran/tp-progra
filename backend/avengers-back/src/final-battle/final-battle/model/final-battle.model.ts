import { HeroApi } from 'src/basic/model/game-api/hero-catalog.model';
import {
  FinalJourneyTeamApi,
  FinalStrategyApi,
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
  heroProfiles: HeroApi[];
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
