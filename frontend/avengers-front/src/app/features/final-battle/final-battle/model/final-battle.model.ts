// Imports que pidió la guía para los eventos del log y el estado narrativo
import { FinalStageEventApi } from '../../live-events/model/live-events.model';
import { FinalNarrativeStateModel } from '../narrative/model/final-narrative.model';

// Estados posibles de la pantalla
export type BattleStatus = 'EMPTY' | 'READY' | 'ACTIVE' | 'COMPLETED' | 'ERROR';
export type ActionCategory = 'attack' | 'ability' | 'item' | 'swap' | 'strategy';

// Molde de cada héroe adaptado para que Leo pinte la UI
export interface FinalBattleHero {
  id: string;
  displayName: string;
  role?: string;
  energy: number;
  maxEnergy: number;
  ap: number;
  maxAp: number;
  isKnockedOut: boolean;
}

// Bando/equipo con titulares, suplentes y la estrategia activa
export interface FinalBattleSide {
  teamId: string;
  strategyCode?: string;
  activeHeroes: FinalBattleHero[];
  reserveHeroes: FinalBattleHero[];
}

// Acción legal con soporte para objetivos, swaps, ítems y estrategias
export interface FinalBattleLegalAction {
  actionId: string;
  actionCode: string;
  category?: ActionCategory;
  actorHeroId?: string;
  targetScope?: 'HERO' | 'TEAM' | 'ANTAGONIST';
  targetSide?: 'PLAYER' | 'OPPONENT' | 'DOOM';
  itemId?: string;
  strategyCode?: string;
  targetHeroId?: string;
  outgoingHeroId?: string;
  incomingHeroId?: string;
  label?: string;
  description?: string;
  apCost?: number;
}

// El estado general de la batalla final con Doom y eventos mecánicos
export interface FinalBattleModel {
  state:
    | (FinalNarrativeStateModel & {
        completion: {
          outcomeCode: 'VICTORY' | 'DEFEAT' | 'ABANDON';
          endingCode: string;
          terminalReasonCode: string | null;
        } | null;
        doom?: FinalBattleDoom;
      })
    | null;
  teams?: {
    player: FinalBattleSide;
    opponent: FinalBattleSide;
    doom?: FinalBattleDoom;
  };
  actions?: FinalBattleLegalAction[];
  events?: FinalStageEventApi[];
  inventory?: FinalBattleInventoryEntry[];
  strategies?: unknown[];
  receipt?: unknown;
}

// Estado de la pantalla con las banderas de carga y recarga obligatoria
export interface FinalBattleViewModel {
  status: BattleStatus;
  error: string | null;
  errorCode: string | null;
  data: FinalBattleModel | null;
  lang: string;
  loading: boolean;
  needsRefresh: boolean;
  submitting: boolean;
  operationError: string | null;
  operationErrorCode: string | null;
  selectedHeroId: string | null;
  selectedGroup: string | null;
  selectedActionId: string | null;
  tab: 'abilities' | 'inventory';
  actionCode: string | null;
}

// Comandos permitidos para enviar al BFF
export interface FinalBattleCommand {
  type: 'START' | 'CHOOSE_ACTION' | 'ABANDON';
  actionId?: string;
}

// Tipado crudo del héroe que viene del backend
export interface HeroeDelBackend {
  id?: string;
  heroId?: string;
  displayName?: string;
  name?: string;
  role?: string;
  energy?: number;
  currentEnergy?: number;
  maxEnergy?: number;
  maximumEnergy?: number;
  ap?: number;
  currentAbilityPoints?: number;
  maxAp?: number;
  maximumAbilityPoints?: number;
  isKnockedOut?: boolean;
  condition?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

// Tipado crudo del equipo que viene del backend
export interface EquipoDelBackend {
  teamId?: string;
  strategyCode?: string;
  heroes?: HeroeDelBackend[];
}

// Tipado crudo de la acción que viene del backend
export interface AccionDelBackend {
  actionId: string;
  actionCode: string;
  itemId?: string;
  strategyCode?: string;
  category?: ActionCategory;
  actorHeroId?: string;
  label?: string;
  description?: string;
  cost?: {
    abilityPoints?: number;
  };
  outgoingHeroId?: string;
  incomingHeroId?: string;
  target?: {
    targetId?: string;
    targetType?: 'HERO' | 'TEAM' | 'ANTAGONIST';
    sideCode?: 'PLAYER' | 'OPPONENT' | 'DOOM';
  };
}

// Perfil que manda el backend para nombres reales y roles
export interface HeroProfileBackend {
  id: string;
  displayName: string;
  roles: { primary: string };
}

// Datos de Doom para la batalla final
export interface FinalBattleDoom {
  narrativeCharacterId: string;
  currentEnergy: number;
  maximumEnergy: number;
  threatLevelCode: string;
}

// Entradas del inventario (consumibles/power-ups)
export interface FinalBattleInventoryEntry {
  itemId: string;
  quantity: number;
  definition: { name: string };
}

// Respuesta completa cruda del endpoint /final-stage
export interface RespuestaBatallaBackend {
  player?: { heroProfiles: HeroProfileBackend[] } | null;
  opponent?: { heroProfiles: HeroProfileBackend[] } | null;
  state?: FinalBattleModel['state'];
  teams?: {
    player?: EquipoDelBackend;
    opponent?: EquipoDelBackend;
    doom?: FinalBattleDoom;
  };
  doom?: FinalBattleDoom;
  actions?: AccionDelBackend[];
  events?: FinalStageEventApi[];
  inventory?: FinalBattleInventoryEntry[];
  strategies?: unknown[];
  receipt?: unknown;
}