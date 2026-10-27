import { Injectable } from '@angular/core';
import { ApiError, toApiError } from '../../../../core/models/api-error.interface';
import { ApiService } from '../../../../core/services/api.service';
import { AppContextService } from '../../../../core/services/app-context.service';
import { BaseApiService } from '../../../../core/services/base-api.service';
import {
  BattleStatus,
  FinalBattleCommand,
  FinalBattleHero,
  FinalBattleLegalAction,
  FinalBattleModel,
  FinalBattleSide,
  FinalBattleViewModel,
  HeroeDelBackend,
  EquipoDelBackend,
  AccionDelBackend,
  RespuestaBatallaBackend,
} from '../model/final-battle.model';

// Contrato para el panel de narrativa -> Ema 
export interface FinalNarrativeViewModel {
  status: BattleStatus;
  error: string | null;
  lang: string;
  state: FinalBattleModel['state'];
  events: unknown[];
}

@Injectable({ providedIn: 'root' })
export class FinalBattleService extends BaseApiService { // hereda de 
  // Estado general de la pantalla consumido por Leo
  private readonly pageState: FinalBattleViewModel = {
    status: 'EMPTY',
    error: null,
    errorCode: null,
    data: null,
    lang: 'es',
    submitting: false, // si está  'cargando'...
    operationError: null,
    operationErrorCode: null,
    selectedHeroId: null,
    selectedGroup: null,
    selectedActionId: null,
    tab: 'abilities',
    actionCode: null,
  };

  constructor(
    api: ApiService,
    private readonly appContextService: AppContextService,
  ) {
    super(api);
  }

  // Método GET 'pageState' para el HTML -> Leo
  getViewModel(): FinalBattleViewModel {
    return this.pageState; 
  }

  // entrega la vista para el panel narrativo de Ema
  getNarrative(): FinalNarrativeViewModel {
    return {
      status: this.pageState.status,
      error: this.pageState.error,
      lang: this.pageState.lang,
      state: this.pageState.data?.state ?? null,
      events: this.pageState.data?.events ?? [],
    };
  }

  // --------------- //

  // Navegación y clicks de usuario

  // Inicializa la pantalla obteniendo el idioma y cargando el estado inicial -> 'pageState'
  initialize(): void {
    this.pageState.lang = this.appContextService.getCurrentLang();
    this.loadBattle();
  }

  // Actualiza la información del combate bajo demanda
  refresh(): void {
    this.loadBattle();
  }

  // selecciona un héroe del equipo activo
  selectHero(heroId: string | null): void {
    if (this.pageState.selectedHeroId === heroId) {
      return;
    }
    this.pageState.selectedHeroId = heroId;
    this.pageState.selectedGroup = null;
    this.pageState.selectedActionId = null;
    this.pageState.actionCode = null;
  }

  // Cambia la pestaña entre habilidades e inventario
  setTab(tab: 'abilities' | 'inventory'): void {
    if (this.pageState.tab === tab) {
      return;
    }
    this.pageState.tab = tab;
    this.pageState.selectedActionId = null;
    this.pageState.actionCode = null;
    this.pageState.selectedGroup = null;
  }

  // guarda la habilidad elegida y resetea el objetivo anterior
  setActionCode(code: string | null): void {
    this.pageState.actionCode = code;
    this.pageState.selectedActionId = null; // aqui resetea la habilidad en 'null' 
  }

  // devuelve los grupos o categorias disponibles segun el contexto actual
  groups(): string[] {
    const actions = this.getAvailableActionsForCurrentContext();
    const uniqueGroups = new Set<string>(); // no permite duplicados 
    for (const action of actions) {
      if (action.category) {
        uniqueGroups.add(action.category);
      }
    }
    return Array.from(uniqueGroups);
  }

  // devuelve los actionCodes disponibles para la pestaña o héroe activo
  actionCodes(): string[] {
    const actions = this.getAvailableActionsForCurrentContext();
    const uniqueCodes = new Set<string>();
    for (const action of actions) {
      if (action.actionCode) {
        uniqueCodes.add(action.actionCode);
      }
    }
    return Array.from(uniqueCodes);
  }

  // selecciona una categoria -> ej: attack, ability, item
  selectGroup(group: string | null): void {
    this.pageState.selectedGroup = group;
    this.pageState.selectedActionId = null; // la resetea en memoria
  }

  // selecciona la acción concreta por su actionId
  selectTarget(actionId: string): void {
    this.pageState.selectedActionId = actionId; // no hace falta resetear en este caso, ya que es la ultima etapa al 'Ejecutar'
  }

  // retorna la acción 'legal' completa seleccionada actualmente
  selectedAction(): FinalBattleLegalAction | null {
    if (!this.pageState.selectedActionId || !this.pageState.data?.actions) {
      return null;
    }
    return (
      this.pageState.data.actions.find( // sirve para buscar un unico elemento dentro de una lista
        (action) => action.actionId === this.pageState.selectedActionId,
      ) ?? null // devuelve null, ya que sino el método find() por defecto, retorna 'undefined'
    );
  }

  // determina si el botón 'Ejecutar' del encabezado debe estar habilitado bajo 3 condiciones
  canExecute(): boolean {
    return (
      !this.pageState.submitting && // si no hay petición HTTP ejecutandose
      this.pageState.status === 'ACTIVE' &&
      this.selectedAction() !== null
    );
  }

  // --- 3 comandos del juego ---- //

  // comando 'START' -> inicia la batalla final
  start(): void {
    this.sendCommand({ type: 'START' });
  }

  // comando 'CHOOSE_ACTION' -> ejecuta la jugada seleccionada
  execute(): void {
    const action = this.selectedAction();
    if (!action) {
      return;
    }
    this.sendCommand({
      type: 'CHOOSE_ACTION',
      actionId: action.actionId,
    });
  }

  // comando 'ABANDON' -> retirada
  abandon(): void {
    this.sendCommand({ type: 'ABANDON' });
  }

  // consulta el endpoint GET '/final-stage' creado en el backend -> final-battle
  private loadBattle(): void {
    this.pageState.status = 'READY';
    this.pageState.error = null; 
    this.pageState.errorCode = null;

    this.getData<RespuestaBatallaBackend>('/final-stage').subscribe({
  next: (respuesta) => { 
    this.updateModel(respuesta);
  },
  error: (error: unknown) => {
    const apiError: ApiError = toApiError(error);
    this.pageState.status = 'ERROR';
    this.pageState.error = apiError.message;
    this.pageState.errorCode = apiError.messageCode;
  },
  });
  }

  // envia comandos al BFF -> backend NestSJ mediante POST '/final-stage/play'
  private sendCommand(command: FinalBattleCommand): void {
    if (this.pageState.submitting) {
      return;
    }

    this.pageState.submitting = true; // que el usuario no pueda elegir 'dos ataques seguidos' 
    this.pageState.operationError = null;
    this.pageState.operationErrorCode = null;

    this.postData<RespuestaBatallaBackend>('/final-stage/play', command).subscribe({
    next: (respuestaActualizada) => {
      this.pageState.submitting = false;
      this.updateModel(respuestaActualizada);
    },
    error: (error: unknown) => {
      this.pageState.submitting = false;
      const apiError: ApiError = toApiError(error);
      this.pageState.operationError = apiError.message;
      this.pageState.operationErrorCode =
        apiError.messageCode ?? 'BFF_FINAL_STAGE_REFRESH_FAILED';
      },
    });
  }

  // obtiene las acciones filtradas por el contexto visual actual -> (si estas en inventario o en héroes))
  private getAvailableActionsForCurrentContext(): FinalBattleLegalAction[] {
    if (!this.pageState.data?.actions) {
      return [];
    }

    // inventario: acciones de items
    if (this.pageState.tab === 'inventory') {
      return this.pageState.data.actions.filter(
        (action) => action.category === 'item' || action.actionCode?.startsWith('item_'),
      );
    }

    // habilidades: acciones del héroe seleccionado
    if (!this.pageState.selectedHeroId) {
      return [];
    }

    return this.pageState.data.actions.filter(
      (action) => action.actorHeroId === this.pageState.selectedHeroId,
    );
  }

  // resuelve el estado de la pantalla a partir de los datos recibidos del BFF (si viene vacío, listo, activo o completado))
  private resolveBattleStatus(data: FinalBattleModel | null): BattleStatus {
    if (!data || !data.state) {
      return 'EMPTY';
    }
    return data.state.status ?? 'READY';
  }

  // función de Limpieza -> limpia selecciones temporales al actualizarse la batalla
  private resetSelections(): void {
    this.pageState.selectedActionId = null;
    this.pageState.selectedGroup = null;
    this.pageState.actionCode = null;
  }

  // adapta la respuesta cruda del BFF al formato estructurado que consume el HTML
  private updateModel(respuesta: RespuestaBatallaBackend | null): void {
    if (!respuesta) {
      return;
    }

    //---- TRANSFORMACION DE DATOS DEL BACKEND A LA VISTA ----//
    // 1 convierte cada personaje uno por uno para que use las propiedades que necesita nuestra vista
    const convertirHeroe = (h: HeroeDelBackend): FinalBattleHero => ({
      id: h.id ?? h.heroId ?? '',
      displayName: h.displayName ?? h.name ?? h.heroId ?? '',
      role: h.role,
      energy: h.energy ?? h.currentEnergy ?? 0,
      maxEnergy: h.maxEnergy ?? h.maximumEnergy ?? 100,
      ap: h.ap ?? h.currentAbilityPoints ?? 0,
      maxAp: h.maxAp ?? h.maximumAbilityPoints ?? 10,
      isKnockedOut: Boolean(
        h.isKnockedOut || h.condition === 'KNOCKED_OUT' || h.condition === 'DEFEATED'
      ),
    });

    // 2 Separación de equipos --> Separa los heroes en titulares (activos) y suplentes (banco
    const armarEquipo = (equipo?: EquipoDelBackend): FinalBattleSide => {
      const listaHeroes = equipo?.heroes ?? [];

      return {
        teamId: equipo?.teamId ?? '',
        strategyCode: equipo?.strategyCode,
        activeHeroes: listaHeroes
          .filter((h) => h.status === 'ACTIVE')
          .map(convertirHeroe),
        reserveHeroes: listaHeroes
          .filter((h) => h.status === 'INACTIVE')
          .map(convertirHeroe),
      };
    };

    // 3 extrae el costo de energia y el rival seleccionado para usarlos directo en los botones
    const accionesMapeadas: FinalBattleLegalAction[] | undefined = respuesta.actions?.map((acc: AccionDelBackend) => ({
      actionId: acc.actionId,
      actionCode: acc.actionCode,
      category: acc.category,
      actorHeroId: acc.actorHeroId,
      outgoingHeroId: acc.outgoingHeroId,
      incomingHeroId: acc.incomingHeroId,
      label: acc.label,
      description: acc.description,
      apCost: acc.cost?.abilityPoints,
      targetHeroId: acc.target?.targetId ?? acc.incomingHeroId,
      targetScope: acc.target?.targetType,
    }));

    // 4 arma el modelo final uniendo los heroes, las acciones y la historia del combate
    const batallaMapeada: FinalBattleModel = {
      state: respuesta.state ?? null,
      teams: respuesta.teams
        ? {
            player: armarEquipo(respuesta.teams.player),
            opponent: armarEquipo(respuesta.teams.opponent),
          }
        : undefined,
      actions: accionesMapeadas,
      events: respuesta.events ?? [],
      inventory: respuesta.inventory ?? [],
      strategies: respuesta.strategies ?? [],
      receipt: respuesta.receipt,
    };

    const rawPlayer = (respuesta as { player?: { strategyCode?: string } })?.player;
    if (rawPlayer?.strategyCode && batallaMapeada.teams?.player) {
      batallaMapeada.teams.player.strategyCode = rawPlayer.strategyCode;
    }

    // 5 actualiza la pantalla con la nueva información y resetea los clics anteriores
    this.pageState.data = batallaMapeada;
    this.pageState.status = this.resolveBattleStatus(batallaMapeada);
    this.resetSelections();
  }
}
