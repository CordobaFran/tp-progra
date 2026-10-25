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

  get isAbilitiesTab(): boolean {
    return this.vm.tab === 'abilities';
  }

  get isInventoryTab(): boolean {
    return this.vm.tab === 'inventory';
  }

  get availableActionCodes(): string[] {
    return this.finalBattleService.actionCodes();
  }

  getActionDescriptor(actionCode: string): FinalBattleLegalAction | undefined {
    return this.vm.data?.actions?.find((a) => a.actionCode === actionCode);
  }

  get legalTargetsForSelectedAction(): FinalBattleLegalAction[] {
    if (!this.vm.actionCode || !this.vm.data?.actions) {
      return [];
    }
    if (this.isAbilitiesTab && this.vm.selectedHeroId) {
      return this.vm.data.actions.filter(
        (a) => a.actorHeroId === this.vm.selectedHeroId && a.actionCode === this.vm.actionCode,
      );
    }
    if (this.isInventoryTab) {
      return this.vm.data.actions.filter((a) => a.actionCode === this.vm.actionCode);
    }
    return [];
  }

  isLegalTarget(heroId: string): boolean {
    return this.legalTargetsForSelectedAction.some((a) => a.targetHeroId === heroId);
  }

  get hasTeamTargetOption(): boolean {
    return this.legalTargetsForSelectedAction.some((a) => a.targetScope === 'TEAM');
  }

  getTeamTargetAction(): FinalBattleLegalAction | undefined {
    return this.legalTargetsForSelectedAction.find((a) => a.targetScope === 'TEAM');
  }

  get selectedAction(): FinalBattleLegalAction | null {
    return this.finalBattleService.selectedAction();
  }

  canExecute(): boolean {
    return this.finalBattleService.canExecute();
  }

  onSelectHero(hero: FinalBattleHero): void {
    if (hero.isKnockedOut) {
      return;
    }
    this.finalBattleService.selectHero(hero.id);
  }

  onSelectTab(tab: 'abilities' | 'inventory'): void {
    this.finalBattleService.setTab(tab);
  }

  onSelectActionCode(actionCode: string): void {
    this.finalBattleService.setActionCode(actionCode);

    const targets = this.legalTargetsForSelectedAction;
    if (targets.length === 1 && !targets[0].targetHeroId) {
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

  onSelectTeamTarget(): void {
    const teamAction = this.getTeamTargetAction();
    if (teamAction) {
      this.finalBattleService.selectTarget(teamAction.actionId);
    }
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
