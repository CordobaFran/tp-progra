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

  get playerSide(): FinalBattleSide | null {
    return this.vm.data?.teams?.player ?? null;
  }

  get opponentSide(): FinalBattleSide | null {
    return this.vm.data?.teams?.opponent ?? null;
  }

  get currentTurn(): number {
    return this.vm.data?.state?.turn ?? 0;
  }

  get currentPhase(): string {
    return this.vm.data?.state?.phase ?? '';
  }

  get currentStrategy(): string {
    const data = this.vm.data as any;
    if (data?.teams?.player?.strategyCode) {
      return data.teams.player.strategyCode;
    }
    if (data?.player?.strategyCode) {
      return data.player.strategyCode;
    }
    return '';
  }

  get isAbilitiesTab(): boolean {
    return this.vm.tab === 'abilities';
  }

  get isInventoryTab(): boolean {
    return this.vm.tab === 'inventory';
  }

  get availableActionCodes(): string[] {
    const actions = (this.vm.data?.actions ?? []) as any[];

    if (this.isAbilitiesTab) {
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

      const hasSwap = actions.some((a) => a.actionCode === 'SWAP');
      if (hasSwap && !codes.includes('SWAP')) {
        codes.push('SWAP');
      }

      return codes;
    }

    return [];
  }

  get inventoryActionCodes(): string[] {
    const actions = (this.vm.data?.actions ?? []) as any[];
    return Array.from(
      new Set(actions.filter((a) => a.actionCode === 'TEAM_ACTION').map((a) => a.actionCode)),
    );
  }

  get strategyActions(): FinalBattleLegalAction[] {
    const actions = (this.vm.data?.actions ?? []) as any[];
    return actions.filter((a) => a.actionCode === 'CHANGE_STRATEGY');
  }

  getActionDescriptor(actionCode: string): FinalBattleLegalAction | undefined {
    const actions = (this.vm.data?.actions ?? []) as any[];
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

  get legalTargetsForSelectedAction(): any[] {
    const actions = (this.vm.data?.actions ?? []) as any[];
    if (!this.vm.actionCode) return [];

    if (this.vm.actionCode === 'SWAP') {
      const activeHero = this.playerSide?.activeHeroes?.find(
        (h) => h.id === this.vm.selectedHeroId,
      );
      const activeName = activeHero?.displayName?.toLowerCase() || '';

      return actions.filter((a) => {
        if (a.actionCode !== 'SWAP') return false;
        if (a.outgoingHeroId && this.vm.selectedHeroId) {
          return a.outgoingHeroId === this.vm.selectedHeroId;
        }
        if (activeName && a.description) {
          return a.description.toLowerCase().includes(`cambia a ${activeName}`);
        }
        return true;
      });
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
    if (this.vm.actionCode === 'SWAP') {
      const reserveHero = this.playerSide?.reserveHeroes?.find((h) => h.id === heroId);
      const reserveName = reserveHero?.displayName?.toLowerCase() || '';
      return this.legalTargetsForSelectedAction.some((a) => {
        if (a.incomingHeroId === heroId || a.targetHeroId === heroId) return true;
        if (reserveName && a.description) {
          return a.description.toLowerCase().includes(`por ${reserveName}`);
        }
        return false;
      });
    }

    return this.legalTargetsForSelectedAction.some((a) => a.targetHeroId === heroId);
  }

  get hasTeamTargetOption(): boolean {
    if (!this.vm.actionCode) return false;
    const actions = (this.vm.data?.actions ?? []) as any[];

    return actions.some((a) => {
      const matchHero = this.isAbilitiesTab ? a.actorHeroId === this.vm.selectedHeroId : true;
      return matchHero && a.actionCode === this.vm.actionCode && a.targetScope === 'TEAM';
    });
  }

  get isTeamTargetSelected(): boolean {
    const sel = this.selectedAction as any;
    return sel?.targetScope === 'TEAM';
  }

  get selectedAction(): FinalBattleLegalAction | null {
    return this.finalBattleService.selectedAction();
  }

  isReserveSelected(heroId: string): boolean {
    const sel = this.selectedAction as any;
    if (!sel || sel.actionCode !== 'SWAP') return false;
    if (sel.incomingHeroId === heroId || sel.targetHeroId === heroId) return true;

    const reserveHero = this.playerSide?.reserveHeroes?.find((h) => h.id === heroId);
    const reserveName = reserveHero?.displayName?.toLowerCase() || '';
    return Boolean(reserveName && sel.description?.toLowerCase().includes(`por ${reserveName}`));
  }

  isHeroTargetSelected(heroId: string): boolean {
    const sel = this.selectedAction as any;
    return sel?.targetHeroId === heroId;
  }

  canExecute(): boolean {
    return this.finalBattleService.canExecute();
  }

  onSelectHero(hero: FinalBattleHero): void {
    if (hero.isKnockedOut) return;
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
    const matchingAction = this.legalTargetsForSelectedAction.find(
      (a) => a.targetHeroId === heroId,
    );
    if (matchingAction) {
      this.finalBattleService.selectTarget(matchingAction.actionId);
    }
  }

  onSelectReserveTarget(reserveHeroId: string): void {
    const actions = (this.vm.data?.actions ?? []) as any[];
    const activeHero =
      this.playerSide?.activeHeroes?.find((h) => h.id === this.vm.selectedHeroId) ||
      this.playerSide?.activeHeroes?.[0];
    const reserveHero = this.playerSide?.reserveHeroes?.find((h) => h.id === reserveHeroId);

    const activeName = activeHero?.displayName?.toLowerCase() || '';
    const reserveName = reserveHero?.displayName?.toLowerCase() || '';

    let swapAction = actions.find((a) => {
      if (a.actionCode !== 'SWAP') return false;
      if (a.outgoingHeroId === activeHero?.id && a.incomingHeroId === reserveHeroId) return true;
      if (activeName && reserveName && a.description) {
        const desc = a.description.toLowerCase();
        return desc.includes(`cambia a ${activeName}`) && desc.includes(`por ${reserveName}`);
      }
      return false;
    });

    if (!swapAction) {
      swapAction = actions.find((a) => {
        if (a.actionCode !== 'SWAP') return false;
        if (a.incomingHeroId === reserveHeroId) return true;
        if (reserveName && a.description) {
          return a.description.toLowerCase().includes(`por ${reserveName}`);
        }
        return false;
      });
    }

    if (swapAction) {
      this.finalBattleService.setActionCode('SWAP');
      this.finalBattleService.selectTarget(swapAction.actionId);
    }
  }

  onSelectTeamTarget(): void {
    const actions = (this.vm.data?.actions ?? []) as any[];
    const teamAction = actions.find((a) => {
      const matchHero = this.isAbilitiesTab ? a.actorHeroId === this.vm.selectedHeroId : true;
      return matchHero && a.actionCode === this.vm.actionCode && a.targetScope === 'TEAM';
    });

    if (teamAction) {
      this.finalBattleService.selectTarget(teamAction.actionId);
    }
  }

  onSelectStrategyAction(action: FinalBattleLegalAction): void {
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

  trackByActionId(_index: number, action: FinalBattleLegalAction): string {
    return action.actionId;
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
