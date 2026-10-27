import { Component, OnInit } from '@angular/core';
import { FinalBattleService, FinalNarrativeViewModel } from './service/final-battle.service';
import { I18nService } from '../../../core/services/i18n.service';
import {
  FinalBattleHero,
  FinalBattleLegalAction,
  FinalBattleSide,
  FinalBattleViewModel,
} from './model/final-battle.model';
import { HeroArtworkResolverService } from 'src/app/core/services/hero-artwork-resolver.service';

// Tipado extendido seguro para compilar sin errores mientras se actualiza el modelo compartido
type SafeLegalAction = FinalBattleLegalAction & {
  outgoingHeroId?: string;
  incomingHeroId?: string;
  target?: { targetId?: string; targetType?: 'HERO' | 'TEAM' } | null;
};

type SafeSide = FinalBattleSide & {
  strategyCode?: string;
};

@Component({
  selector: 'app-final-battle',
  templateUrl: './final-battle.component.html',
  styleUrls: ['./final-battle.component.css'],
  standalone: false,
})
export class FinalBattleComponent implements OnInit {
  constructor(
    private readonly finalBattleService: FinalBattleService,
    private readonly i18nService: I18nService,
    private readonly artwork: HeroArtworkResolverService,
  ) {}

  ngOnInit(): void {
    this.finalBattleService.initialize();
  }

  get vm(): FinalBattleViewModel {
    return this.finalBattleService.getViewModel();
  }

  get status(): string {
    return this.vm.status;
  }

  get narrativeView(): FinalNarrativeViewModel {
    return this.finalBattleService.getNarrative();
  }

  get playerSide(): SafeSide | null {
    return (this.vm.data?.teams?.player as SafeSide) ?? null;
  }

  get opponentSide(): SafeSide | null {
    return (this.vm.data?.teams?.opponent as SafeSide) ?? null;
  }

  get currentTurn(): number {
    return this.vm.data?.state?.turn ?? 0;
  }

  get currentPhase(): string {
    return this.vm.data?.state?.phase ?? '';
  }

  get currentStrategy(): string {
    return this.playerSide?.strategyCode ?? '';
  }

  get isAbilitiesTab(): boolean {
    return this.vm.tab === 'abilities';
  }

  get isInventoryTab(): boolean {
    return this.vm.tab === 'inventory';
  }

  get availableActionCodes(): string[] {
    const actions = (this.vm.data?.actions ?? []) as SafeLegalAction[];
    if (!this.isAbilitiesTab) {
      return [];
    }

    const codes: string[] = [];

    if (this.vm.selectedHeroId) {
      actions
        .filter((a) => a.actorHeroId === this.vm.selectedHeroId)
        .forEach((a) => {
          if (!codes.includes(a.actionCode)) {
            codes.push(a.actionCode);
          }
        });
    }

    if (actions.some((a) => a.actionCode === 'SWAP')) {
      codes.push('SWAP');
    }

    return codes;
  }

  get inventoryActionCodes(): string[] {
    const actions = (this.vm.data?.actions ?? []) as SafeLegalAction[];
    return Array.from(
      new Set(actions.filter((a) => a.actionCode === 'TEAM_ACTION').map((a) => a.actionCode)),
    );
  }

  get strategyActions(): SafeLegalAction[] {
    const actions = (this.vm.data?.actions ?? []) as SafeLegalAction[];
    return actions.filter((a) => a.actionCode === 'CHANGE_STRATEGY');
  }

  getActionDescriptor(actionCode: string): SafeLegalAction | undefined {
    const actions = (this.vm.data?.actions ?? []) as SafeLegalAction[];
    if (actionCode === 'SWAP') {
      return actions.find((a) => a.actionCode === 'SWAP');
    }
    if (this.isAbilitiesTab && this.vm.selectedHeroId) {
      return actions.find(
        (a) => a.actorHeroId === this.vm.selectedHeroId && a.actionCode === actionCode,
      );
    }
    return actions.find((a) => a.actionCode === actionCode);
  }

  get legalTargetsForSelectedAction(): SafeLegalAction[] {
    const actions = (this.vm.data?.actions ?? []) as SafeLegalAction[];
    if (!this.vm.actionCode) {
      return [];
    }

    if (this.vm.actionCode === 'SWAP') {
      const activeId = this.vm.selectedHeroId || this.playerSide?.activeHeroes[0]?.id;
      return actions.filter(
        (a) => a.actionCode === 'SWAP' && (!activeId || a.outgoingHeroId === activeId),
      );
    }

    if (this.vm.actionCode === 'TEAM_ACTION') {
      return actions.filter((a) => a.actionCode === 'TEAM_ACTION');
    }

    if (this.isAbilitiesTab && this.vm.selectedHeroId) {
      return actions.filter(
        (a) => a.actorHeroId === this.vm.selectedHeroId && a.actionCode === this.vm.actionCode,
      );
    }

    return [];
  }

  isLegalTarget(heroId: string): boolean {
    return this.legalTargetsForSelectedAction.some((a) => {
      if (a.actionCode === 'SWAP') {
        return a.incomingHeroId === heroId || a.targetHeroId === heroId;
      }
      return a.targetHeroId === heroId || a.target?.targetId === heroId;
    });
  }

  get hasTeamTargetOption(): boolean {
    if (!this.vm.actionCode) {
      return false;
    }
    const actions = (this.vm.data?.actions ?? []) as SafeLegalAction[];

    return actions.some((a) => {
      const matchHero = this.isAbilitiesTab ? a.actorHeroId === this.vm.selectedHeroId : true;
      return (
        matchHero &&
        a.actionCode === this.vm.actionCode &&
        (a.targetScope === 'TEAM' || a.target?.targetType === 'TEAM')
      );
    });
  }

  get isTeamTargetSelected(): boolean {
    const sel = this.selectedAction as SafeLegalAction | null;
    return sel?.targetScope === 'TEAM' || sel?.target?.targetType === 'TEAM';
  }

  get selectedAction(): SafeLegalAction | null {
    return (this.finalBattleService.selectedAction() as SafeLegalAction) ?? null;
  }

  isReserveSelected(heroId: string): boolean {
    const sel = this.selectedAction;
    return (
      sel?.actionCode === 'SWAP' && (sel.incomingHeroId === heroId || sel.targetHeroId === heroId)
    );
  }

  isHeroTargetSelected(heroId: string): boolean {
    const sel = this.selectedAction;
    return sel?.targetHeroId === heroId || sel?.target?.targetId === heroId;
  }

  canExecute(): boolean {
    return this.finalBattleService.canExecute();
  }

  onSelectHero(hero: FinalBattleHero): void {
    if (hero.isKnockedOut) {
      return;
    }
    const wasSwap = this.vm.actionCode === 'SWAP';
    this.finalBattleService.selectHero(hero.id);
    if (wasSwap) {
      this.finalBattleService.setActionCode('SWAP');
    }
  }

  onSelectTab(tab: 'abilities' | 'inventory'): void {
    this.finalBattleService.setTab(tab);
  }

  onSelectActionCode(actionCode: string): void {
    this.finalBattleService.setActionCode(actionCode);

    const targets = this.legalTargetsForSelectedAction;
    if (targets.length === 1 && !targets[0].targetHeroId && !targets[0].incomingHeroId) {
      this.finalBattleService.selectTarget(targets[0].actionId);
    }
  }

  onSelectHeroTarget(heroId: string): void {
    const matchingAction = this.legalTargetsForSelectedAction.find((a) => {
      return a.targetHeroId === heroId || a.target?.targetId === heroId;
    });
    if (matchingAction) {
      this.finalBattleService.selectTarget(matchingAction.actionId);
    }
  }

  onSelectReserveTarget(reserveHeroId: string): void {
    const actions = (this.vm.data?.actions ?? []) as SafeLegalAction[];
    const activeHeroId = this.vm.selectedHeroId || this.playerSide?.activeHeroes[0]?.id;

    let swapAction = actions.find(
      (a) =>
        a.actionCode === 'SWAP' &&
        a.outgoingHeroId === activeHeroId &&
        (a.incomingHeroId === reserveHeroId || a.targetHeroId === reserveHeroId),
    );

    if (!swapAction) {
      swapAction = actions.find(
        (a) =>
          a.actionCode === 'SWAP' &&
          (a.incomingHeroId === reserveHeroId || a.targetHeroId === reserveHeroId),
      );
    }

    if (swapAction) {
      this.finalBattleService.setActionCode('SWAP');
      this.finalBattleService.selectTarget(swapAction.actionId);
    }
  }

  onSelectTeamTarget(): void {
    const actions = (this.vm.data?.actions ?? []) as SafeLegalAction[];
    const teamAction = actions.find((a) => {
      const matchHero = this.isAbilitiesTab ? a.actorHeroId === this.vm.selectedHeroId : true;
      return (
        matchHero &&
        a.actionCode === this.vm.actionCode &&
        (a.targetScope === 'TEAM' || a.target?.targetType === 'TEAM')
      );
    });

    if (teamAction) {
      this.finalBattleService.selectTarget(teamAction.actionId);
    }
  }

  onSelectStrategyAction(action: SafeLegalAction): void {
    this.finalBattleService.setActionCode(action.actionCode);
    this.finalBattleService.selectTarget(action.actionId);
  }

  onStart(): void {
    this.finalBattleService.start();
  }

  onExecute(): void {
    this.finalBattleService.execute();
  }

  onAbandon(): void {
    this.finalBattleService.abandon();
  }

  onRefresh(): void {
    this.finalBattleService.refresh();
  }

  translate(key: string): string {
    return this.i18nService.t(key as any);
  }

  trackByHeroId(_index: number, hero: FinalBattleHero): string {
    return hero.id;
  }

  trackByActionCode(_index: number, code: string): string {
    return code;
  }

  trackByActionId(_index: number, action: SafeLegalAction): string {
    return action.actionId;
  }

  trackByEventIndex(index: number): number {
    return index;
  }

  portraitPath(heroId: string): string {
    return this.artwork.portraitPath(heroId);
  }

  cardPath(heroId: string): string {
    return this.artwork.cardPath(heroId);
  }

  imageError(event: Event): void {
    this.artwork.useFallback(event);
  }
}
