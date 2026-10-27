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
  HeroProfileBackend,
} from '../model/final-battle.model';
import { FinalNarrativeViewModel } from '../narrative/model/final-narrative.model';

export { FinalNarrativeViewModel } from '../narrative/model/final-narrative.model';

@Injectable({ providedIn: 'root' })
export class FinalBattleService extends BaseApiService {
  // Contador para descartar respuestas viejas que lleguen tarde por la red
  private latestRequestId = 0;

  // Estado general de la pantalla consumido por Leo
  private readonly pageState: FinalBattleViewModel = {
    status: 'EMPTY',
    error: null,
    errorCode: null,
    data: null,
    lang: 'es',
    loading: false, // bandera de carga inicial
    needsRefresh: false, // marca si hubo un error y hay que recargar sí o sí
    submitting: false, // si se está enviando una jugada
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

  // Entrega el estado completo de la batalla para que Leo arme el HTML
  getViewModel(): FinalBattleViewModel {
    return this.pageState;
  }

  // Entrega los datos masticados para el panel narrativo de Ema
  getNarrative(): FinalNarrativeViewModel {
    const state = this.pageState;
    return {
      status: state.loading
        ? 'loading'
        : state.status === 'ERROR'
        ? 'error'
        : !state.data?.events?.length
        ? 'empty'
        : 'data',
      error: state.error,
      errorCode: state.errorCode,
      lang: state.lang === 'es' ? 'es' : 'en',
      state: state.data?.state ?? null,
      events: state.data?.events ?? [],
    };
  }

  // Inicializa la pantalla cargando idioma y pegándole al endpoint inicial
  initialize(): void {
    this.pageState.lang = this.appContextService.getCurrentLang();
    this.loadBattle();
  }

  // Fuerza la recarga manual de la batalla (cuando tocan el botón Actualizar)
  refresh(): void {
    this.loadBattle();
  }

  // El candado central: bloquea clicks si la batalla no está activa, si está cargando o si falló
  canInteract(): boolean {
    return (
      this.pageState.status === 'ACTIVE' &&
      !this.pageState.loading &&
      !this.pageState.submitting &&
      !this.pageState.needsRefresh
    );
  }

  // Selecciona un héroe titular del equipo
  selectHero(heroId: string | null): void {
    if (!this.canInteract()) {
      return;
    }
    if (this.pageState.selectedHeroId === heroId) {
      return;
    }
    this.pageState.selectedHeroId = heroId;
    this.pageState.selectedGroup = null;
    this.pageState.selectedActionId = null;
    this.pageState.actionCode = null;
  }

  // Alterna entre la pestaña de habilidades y la de inventario
  setTab(tab: 'abilities' | 'inventory'): void {
    if (!this.canInteract()) {
      return;
    }
    if (this.pageState.tab === tab) {
      return;
    }
    this.pageState.tab = tab;
    this.pageState.selectedActionId = null;
    this.pageState.actionCode = null;
    this.pageState.selectedGroup = null;
  }

  // Guarda el código de la acción elegida (ataque, swap, etc.) y limpia el objetivo anterior
  setActionCode(code: string | null): void {
    if (!this.canInteract()) {
      return;
    }
    this.pageState.actionCode = code;
    this.pageState.selectedActionId = null;
  }

  // Devuelve las categorías disponibles según si estamos en inventario o en un héroe
  groups(): string[] {
    const actions = this.getAvailableActionsForCurrentContext();
    const uniqueGroups = new Set<string>();
    for (const action of actions) {
      if (action.category) {
        uniqueGroups.add(action.category);
      }
    }
    return Array.from(uniqueGroups);
  }

  // Devuelve los códigos de acción disponibles sin repetir
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

  // Filtra por categoría (ej: attack, ability, item)
  selectGroup(group: string | null): void {
    if (!this.canInteract()) {
      return;
    }
    this.pageState.selectedGroup = group;
    this.pageState.selectedActionId = null;
  }

  // Selecciona el objetivo final por su actionId para dejar lista la jugada
  selectTarget(actionId: string): void {
    if (
      !this.canInteract() ||
      !this.pageState.data?.actions?.some((action) => action.actionId === actionId)
    ) {
      return;
    }
    this.pageState.selectedActionId = actionId;
  }

  // Busca en la lista la acción completa que el usuario tiene seleccionada
  selectedAction(): FinalBattleLegalAction | null {
    if (!this.pageState.selectedActionId || !this.pageState.data?.actions) {
      return null;
    }
    return (
      this.pageState.data.actions.find(
        (action) => action.actionId === this.pageState.selectedActionId,
      ) ?? null
    );
  }

  // Habilita el botón Ejecutar solo si el usuario puede operar y eligió una acción válida
  canExecute(): boolean {
    return this.canInteract() && this.selectedAction() !== null;
  }

  // Inicia el combate enviando comando START
  start(): void {
    this.sendCommand({ type: 'START' });
  }

  // Manda la jugada elegida al backend con su actionId
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

  // Abandona la partida enviando comando ABANDON
  abandon(): void {
    this.sendCommand({ type: 'ABANDON' });
  }

  // Consulta el endpoint GET '/final-stage'
  private loadBattle(): void {
    if (this.pageState.loading || this.pageState.submitting) {
      return;
    }

    const requestId = ++this.latestRequestId;
    this.pageState.loading = true;
    this.pageState.error = null;
    this.pageState.errorCode = null;
    this.resetSelections();

    this.getData<RespuestaBatallaBackend>('/final-stage').subscribe({
      next: (response) => {
        // Si llegó una respuesta vieja de una petición anterior, la descartamos
        if (requestId !== this.latestRequestId) {
          return;
        }
        this.pageState.loading = false;
        this.pageState.needsRefresh = false;
        this.pageState.operationError = null;
        this.pageState.operationErrorCode = null;
        this.updateModel(response);
      },
      error: (error: unknown) => {
        if (requestId !== this.latestRequestId) {
          return;
        }
        const apiError = toApiError(error);
        this.pageState.loading = false;
        this.pageState.needsRefresh = true; // Si falló, obligamos a refrescar
        this.pageState.status = 'ERROR';
        this.pageState.error = apiError.message;
        this.pageState.errorCode = apiError.messageCode;
      },
    });
  }

  // Envía jugadas o comandos mediante POST '/final-stage/play'
  private sendCommand(command: FinalBattleCommand): void {
    const state = this.pageState;
    if (state.loading || state.submitting || state.needsRefresh) {
      return;
    }

    if (command.type === 'START' && state.status !== 'READY' && state.status !== 'ACTIVE') {
      return;
    }

    if (
      command.type === 'CHOOSE_ACTION' &&
      !state.data?.actions?.some((action) => action.actionId === command.actionId)
    ) {
      return;
    }

    const requestId = ++this.latestRequestId;
    state.submitting = true;
    state.operationError = null;
    state.operationErrorCode = null;

    this.postData<RespuestaBatallaBackend>('/final-stage/play', command).subscribe({
      next: (response) => {
        if (requestId !== this.latestRequestId) {
          return;
        }
        state.submitting = false;
        state.needsRefresh = false;
        this.updateModel(response);
      },
      error: (error: unknown) => {
        if (requestId !== this.latestRequestId) {
          return;
        }
        const apiError: ApiError = toApiError(error);
        state.submitting = false;
        state.needsRefresh = true;
        state.operationError = apiError.message;
        state.operationErrorCode = apiError.messageCode;
        this.resetSelections();
      },
    });
  }

  // Filtra acciones según si el usuario está en el inventario o mirando un héroe
  private getAvailableActionsForCurrentContext(): FinalBattleLegalAction[] {
    if (!this.pageState.data?.actions) {
      return [];
    }

    // Inventario: ahora incluye consumibles reales, jugadas en equipo y cambio de estrategia
    if (this.pageState.tab === 'inventory') {
      return this.pageState.data.actions.filter((action) =>
        ['POWER_UP', 'TEAM_ACTION', 'CHANGE_STRATEGY'].includes(action.actionCode),
      );
    }

    if (!this.pageState.selectedHeroId) {
      return [];
    }

    // Héroes: acciones donde el personaje seleccionado es el atacante/actor
    return this.pageState.data.actions.filter(
      (action) => action.actorHeroId === this.pageState.selectedHeroId,
    );
  }

  // Define el estado visual: si está vacío, listo, activo o terminado
  private resolveBattleStatus(data: FinalBattleModel | null): BattleStatus {
    if (!data || !data.state) {
      return 'EMPTY';
    }
    return data.state.status ?? 'READY';
  }

  // Limpia selecciones temporales para no arrastrar botones marcados de turnos viejos
  private resetSelections(): void {
    this.pageState.selectedActionId = null;
    this.pageState.selectedGroup = null;
    this.pageState.actionCode = null;
  }

  // Mapea y limpia el JSON crudo del backend al formato que necesita el HTML
  private updateModel(respuesta: RespuestaBatallaBackend | null): void {
    if (!respuesta) {
      this.pageState.data = null;
      this.pageState.status = 'EMPTY';
      this.pageState.selectedHeroId = null;
      this.resetSelections();
      return;
    }

    // Función interna: arma el equipo uniendo datos mecánicos con los perfiles del backend
    const armarEquipo = (
      equipo?: EquipoDelBackend,
      perfiles: HeroProfileBackend[] = [],
    ): FinalBattleSide => {
      const convertirHeroe = (h: HeroeDelBackend): FinalBattleHero => {
        const id = h.heroId ?? h.id ?? '';
        // Rescata el nombre y rol real desde los perfiles para que no quede vacío
        const profile = perfiles.find((hero) => hero.id === id);
        return {
          id,
          displayName: profile?.displayName ?? h.displayName ?? h.name ?? id,
          role: profile?.roles.primary ?? h.role,
          energy: h.currentEnergy ?? h.energy ?? 0,
          maxEnergy: h.maximumEnergy ?? h.maxEnergy ?? 0,
          ap: h.currentAbilityPoints ?? h.ap ?? 0,
          maxAp: h.maximumAbilityPoints ?? h.maxAp ?? 0,
          isKnockedOut: Boolean(h.isKnockedOut || h.condition === 'KNOCKED_OUT'),
        };
      };

      const heroes = equipo?.heroes ?? [];
      return {
        teamId: equipo?.teamId ?? '',
        strategyCode: equipo?.strategyCode, // Mantiene la estrategia viva
        activeHeroes: heroes.filter((h) => h.status === 'ACTIVE').map(convertirHeroe),
        reserveHeroes: heroes.filter((h) => h.status === 'INACTIVE').map(convertirHeroe),
      };
    };

    // Construye el modelo final con la información del combate, Doom y consumibles
    const data: FinalBattleModel = {
      state: respuesta.state ?? null,
      teams: respuesta.teams
        ? {
            player: armarEquipo(respuesta.teams.player, respuesta.player?.heroProfiles ?? []),
            opponent: armarEquipo(respuesta.teams.opponent, respuesta.opponent?.heroProfiles ?? []),
            doom: respuesta.teams.doom,
          }
        : undefined,
      actions:
        respuesta.actions?.map((acc: AccionDelBackend) => ({
          actionId: acc.actionId,
          actionCode: acc.actionCode,
          category: acc.category,
          actorHeroId: acc.actorHeroId,
          outgoingHeroId: acc.outgoingHeroId, // Quién sale en el SWAP
          incomingHeroId: acc.incomingHeroId, // Quién entra en el SWAP
          label: acc.label,
          description: acc.description,
          apCost: acc.cost?.abilityPoints,
          targetHeroId: acc.target?.targetId ?? acc.incomingHeroId, // Fallback clave para el SWAP
          targetScope: acc.target?.targetType,
          targetSide: acc.target?.sideCode, // Distingue si apuntás a rival, aliado o Doom
          itemId: acc.itemId,
          strategyCode: acc.strategyCode,
        })) ?? [],
      events: respuesta.events ?? [],
      inventory: respuesta.inventory ?? [],
      strategies: respuesta.strategies ?? [],
      receipt: respuesta.receipt,
    };

    this.pageState.data = data;
    this.pageState.status = this.resolveBattleStatus(data);

    // Si el héroe que estaba seleccionado cayó noqueado o ya no está activo, lo deselecciona
    if (
      !data.teams?.player.activeHeroes.some(
        (hero) => hero.id === this.pageState.selectedHeroId && !hero.isKnockedOut,
      )
    ) {
      this.pageState.selectedHeroId = null;
    }

    this.resetSelections();
  }
}