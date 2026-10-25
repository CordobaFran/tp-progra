// asegurarse de que back y front usen los mismos nombres y tipo de variables -> Frontend / BFF Backend

export type BattleStatus = 'READY' | 'ACTIVE' | 'COMPLETED' | 'EMPTY' | 'ERROR';
// estados válidos en los que puede estar la pantalla de batalla
export type ActionCategory = 'attack' | 'ability' | 'item' | 'swap' | 'strategy';

// Ordenes de juego válidos, empaquetan los clicks/botones del usuario (iniciar, habilidad o rendirse) para el POST del Back
export type FinalBattleCommand =
  | { type: 'START' } 
  | { type: 'CHOOSE_ACTION'; actionId: string }
  | { type: 'ABANDON' };

// Modelo de una acción/ejecución valida devuelta por la API
export interface FinalBattleLegalAction {
  actionId: string; // El id que le puso la Game API a esta jugada
  actionCode: string;
  category?: ActionCategory;
  actorHeroId?: string; // que heroe puede hacerla (ej: Ironman)
  targetScope?: 'HERO' | 'TEAM'; // Si afecta a uno solo o a todo el equipo
  targetHeroId?: string; // ataque u habilidad que tires al rival
  label?: string; // texto legible para el botón -> 'lanzar rayo'
  description?: string; // breve descripción de lo que hace
  apCost?: number; // cuanto cuesta de stamina o mana del héroe
}

// Representación de un heroe en la batalla final
export interface FinalBattleHero {
  id: string;
  displayName: string; // nombre del heroe
  role?: string;       
  energy?: number; // barra de energia
  maxEnergy?: number; // 
  ap?: number; // puntos de accion
  maxAp?: number;
  isKnockedOut?: boolean; // si está activo o fuera de combate
}

// lado del equipo (jugador o rival)
export interface FinalBattleSide {
  teamId: string;
  activeHeroes: FinalBattleHero[]; // quienes están activos y quienes en la banca 
  reserveHeroes: FinalBattleHero[];
}

// modelo principal de la Batalla Final devuelto por el BFF
// todo lo que nos devuelve el Backend (BFF) en cada turno.
// trae el estado actual, ambos equipos, las acciones válidas, eventos e inventario.
// si el usuario todavía no arrancó el torneo, state viene en null.
export interface FinalBattleModel {
  state: {
    status: BattleStatus;
    turn?: number;
    phase?: string;
    lifecycle?: string;
    winnerTeamId?: string;
    abandoned?: boolean;
  } | null; // viene null
  teams?: {
    player: FinalBattleSide;
    opponent: FinalBattleSide;
  };
  actions?: FinalBattleLegalAction[];
  events?: unknown[];
  inventory?: unknown[];
  strategies?: unknown[];
  receipt?: unknown;
}

// estado global de pantalla consumido por Leo en el Componente y HTML
// servicio que proveera a Leo para que utilice en su HTML para dibujar cada componente
export interface FinalBattleViewModel {
  status: BattleStatus;
  error: string | null;
  errorCode: string | null;
  data: FinalBattleModel | null; // Guarda la ultima respuesta limpia recibida del backend
  lang: string;
  submitting: boolean; 
  operationError: string | null;
  operationErrorCode: string | null;
  selectedHeroId: string | null;
  selectedGroup: string | null; // estos 3 rastrean que heroe hizo click el usuario, habilidad y objetivo seleccionó
  selectedActionId: string | null;
  tab: 'abilities' | 'inventory'; // si se están enviando las habilidades del heroe u objetos del inventario
  actionCode: string | null;
}

// interfaz para saber como viene el 'héroe' crudo desde el backend
export interface HeroeDelBackend {
  heroId?: string;
  id?: string;
  displayName?: string;
  name?: string;
  role?: string;
  currentEnergy?: number;
  energy?: number;
  maximumEnergy?: number;
  maxEnergy?: number;
  currentAbilityPoints?: number;
  maximumAbilityPoints?: number;
  ap?: number;
  maxAp?: number;
  status?: string;
  condition?: string;
  isKnockedOut?: boolean;
}

// interfaz para saber como vienen las acciones crudas del backend
export interface AccionDelBackend {
  actionId: string;
  actionCode: string;
  category?: ActionCategory;
  actorHeroId?: string;
  label?: string;
  description?: string;
  cost?: {
    abilityPoints?: number;
  };
  target?: {
    targetId?: string;
    targetType?: 'HERO' | 'TEAM';
  };
}

// interfaz para saber como viene el 'equipo' desde el backend
export interface EquipoDelBackend {
  teamId?: string;
  heroes?: HeroeDelBackend[];
}

// interfaz para la respuesta general cruda del backend
export interface RespuestaBatallaBackend {
  state?: FinalBattleModel['state'];
  teams?: {
    player?: EquipoDelBackend;
    opponent?: EquipoDelBackend;
  };
  actions?: AccionDelBackend[];
  events?: unknown[];
  inventory?: unknown[];
  strategies?: unknown[];
  receipt?: unknown;
}