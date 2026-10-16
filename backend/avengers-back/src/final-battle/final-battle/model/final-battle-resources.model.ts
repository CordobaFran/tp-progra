import {
  FinalJourneyTeamsApi,
  FinalStrategyApi,
} from '../../../basic/model/game-api/final-contract.model';
import { HeroApi } from '../../../basic/model/game-api/hero-catalog.model';

export interface InventoryEntryApi {
  itemId: string;
  quantity: number;
  legalUseContexts: string[];
}

export interface InventoryApi {
  attemptId: string;
  teamId: string;
  items: InventoryEntryApi[];
}

export interface PowerUpApi {
  id: string;
  name: string;
  description: string;
  categoryCode: string;
  price: number;
  targetScope: string;
  useContexts: string[];
  effect: { effectCode: string; [field: string]: unknown };
}

export interface PowerUpCatalogApi {
  language: string;
  powerUps: PowerUpApi[];
}

export interface FinalBattleResources {
  attemptId: string;
  teamId: string;
  language: string;
  currentTeams: FinalJourneyTeamsApi | null;
  heroes: HeroApi[];
  inventory: InventoryApi | null;
  powerUps: PowerUpApi[];
  strategies: FinalStrategyApi[];
}
