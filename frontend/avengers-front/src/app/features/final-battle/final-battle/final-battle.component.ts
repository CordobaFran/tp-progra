import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { FinalBattleService, FinalNarrativeViewModel } from './service/final-battle.service';
import { I18nService, AppCopyKey } from '../../../core/services/i18n.service';
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
export class FinalBattleComponent implements OnInit, AfterViewChecked {
  @ViewChild('narrativeLog')
  private readonly narrativeLogContainer?: ElementRef<HTMLDivElement>;

  private previousEventsCount = 0;

  private followNarrative = true;

  private narrativeScrollTop = 0;

  constructor(
    private readonly finalBattleService: FinalBattleService,
    private readonly i18nService: I18nService,
    private readonly artwork: HeroArtworkResolverService,
  ) {}

  ngOnInit(): void {
    this.finalBattleService.initialize();
  }

  ngAfterViewChecked(): void {
    if (this.vm.loading || this.vm.submitting) {
      return;
    }
    const currentCount = this.vm.data?.events?.length ?? 0;
    const previousCount = this.previousEventsCount;
    this.previousEventsCount = currentCount;
    this.updateNarrativeScroll(
      currentCount > previousCount
        ? previousCount === 0
          ? currentCount - 1
          : previousCount
        : null,
    );
  }

  onNarrativeScroll(): void {
    const el = this.narrativeLogContainer?.nativeElement;
    if (el && !this.vm.loading && !this.vm.submitting) {
      this.narrativeScrollTop = el.scrollTop;
      this.followNarrative = el.scrollHeight - el.scrollTop - el.clientHeight <= 24;
    }
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
    return this.vm.data?.state?.normalTurn ?? 0;
  }

  get currentPhase(): string {
    return this.vm.data?.state?.phaseLabel ?? '';
  }

  get currentStrategy(): string {
    return this.vm.data?.teams?.player?.strategyCode || this.playerSide?.strategyCode || 'BALANCED';
  }

  get isAbilitiesTab(): boolean {
    return this.vm.tab === 'abilities';
  }

  get isInventoryTab(): boolean {
    return this.vm.tab === 'inventory';
  }

  get availableActionCodes(): string[] {
    const actions: FinalBattleLegalAction[] = this.vm.data?.actions ?? [];
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
    return [
      ...new Set(
        (this.vm.data?.actions ?? [])
          .filter((action) => ['TEAM_ACTION', 'POWER_UP'].includes(action.actionCode))
          .map((action) => action.actionCode),
      ),
    ];
  }

  get strategyActions(): FinalBattleLegalAction[] {
    const actions: FinalBattleLegalAction[] = this.vm.data?.actions ?? [];
    return actions.filter((a) => a.actionCode === 'CHANGE_STRATEGY');
  }

  getActionDescriptor(actionCode: string): FinalBattleLegalAction | undefined {
    const actions: FinalBattleLegalAction[] = this.vm.data?.actions ?? [];
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

  get legalTargetsForSelectedAction(): FinalBattleLegalAction[] {
    const actions = (this.vm.data?.actions ?? []).filter(
      (action) => action.actionCode === this.vm.actionCode,
    );
    if (this.vm.actionCode === 'SWAP') {
      const selected = actions.filter((action) => action.outgoingHeroId === this.vm.selectedHeroId);
      return selected.length ? selected : actions;
    }
    if (this.isInventoryTab) {
      return actions;
    }
    return actions.filter((action) => action.actorHeroId === this.vm.selectedHeroId);
  }

  isLegalTarget(heroId: string): boolean {
    return this.legalTargetsForSelectedAction.some(
      (action) =>
        (action.targetSide === 'OPPONENT' &&
          action.targetScope === 'HERO' &&
          action.targetHeroId === heroId) ||
        (action.actionCode === 'SWAP' &&
          (action.incomingHeroId === heroId || action.targetHeroId === heroId)),
    );
  }

  get isTeamActionSelected(): boolean {
    return this.selectedAction?.targetScope === 'TEAM';
  }

  get requiresTarget(): boolean {
    if (!this.vm.actionCode) {
      return false;
    }
    return this.vm.actionCode !== 'CHANGE_STRATEGY';
  }

  get selectedAction(): FinalBattleLegalAction | null {
    return this.finalBattleService.selectedAction();
  }

  get currentTargetName(): string {
    return this.selectedAction ? this.actionTargetName(this.selectedAction) : '';
  }

  get doom() {
    return this.vm.data?.state?.doom ?? this.vm.data?.teams?.doom;
  }

  get completionLabel(): string {
    const outcome = this.vm.data?.state?.completion?.outcomeCode;
    return outcome === 'VICTORY'
      ? this.translate('r6.victory')
      : outcome === 'DEFEAT'
        ? this.translate('r6.defeat')
        : outcome === 'ABANDON'
          ? this.translate('r6.abandon')
          : '';
  }

  actionTargetName(action: FinalBattleLegalAction): string {
    const heroes = [
      ...(this.playerSide?.activeHeroes ?? []),
      ...(this.playerSide?.reserveHeroes ?? []),
    ];
    const name = (id?: string) => heroes.find((h) => h.id === id)?.displayName ?? id ?? '';
    if (action.actionCode === 'SWAP') {
      return `${name(action.outgoingHeroId)} -> ${name(action.incomingHeroId)}`;
    }
    if (action.targetScope === 'ANTAGONIST') {
      return 'Doctor Doom';
    }
    if (action.targetScope === 'TEAM') {
      return this.translate(action.targetSide === 'PLAYER' ? 'r9.playerTeam' : 'r9.opponent');
    }
    const side = action.targetSide === 'PLAYER' ? this.playerSide : this.opponentSide;
    return (
      [...(side?.activeHeroes ?? []), ...(side?.reserveHeroes ?? [])].find(
        (hero) => hero.id === action.targetHeroId,
      )?.displayName ??
      action.targetHeroId ??
      this.translate('r9.noTarget')
    );
  }

  itemName(action: FinalBattleLegalAction): string {
    return (
      this.vm.data?.inventory?.find((item) => item.itemId === action.itemId)?.definition.name ??
      action.itemId ??
      ''
    );
  }

  onSelectLegalAction(action: FinalBattleLegalAction): void {
    if (this.legalTargetsForSelectedAction.some((entry) => entry.actionId === action.actionId)) {
      this.finalBattleService.selectTarget(action.actionId);
    }
  }

  get opponentStrategy(): string {
    return this.opponentSide?.strategyCode || '';
  }

  isReserveSelected(heroId: string): boolean {
    const sel = this.selectedAction;
    return Boolean(
      sel?.actionCode === 'SWAP' && (sel.incomingHeroId === heroId || sel.targetHeroId === heroId),
    );
  }

  isHeroTargetSelected(heroId: string): boolean {
    const action = this.selectedAction;
    return (
      action?.targetSide === 'OPPONENT' &&
      (action.targetScope === 'TEAM' || action.targetHeroId === heroId)
    );
  }

  canExecute(): boolean {
    return this.finalBattleService.canExecute();
  }

  onSelectTab(tab: 'abilities' | 'inventory'): void {
    this.finalBattleService.setTab(tab);
  }

  onSelectHero(hero: FinalBattleHero): void {
    this.finalBattleService.selectHero(hero.id);
  }

  onSelectActionCode(code: string): void {
    this.finalBattleService.setActionCode(code);
    const options = this.legalTargetsForSelectedAction;
    if (options.length === 1) {
      this.finalBattleService.selectTarget(options[0].actionId);
    }
  }

  onSelectHeroTarget(heroId: string): void {
    const action = this.legalTargetsForSelectedAction.find(
      (entry) =>
        entry.targetSide === 'OPPONENT' &&
        entry.targetScope === 'HERO' &&
        entry.targetHeroId === heroId,
    );
    if (action) {
      this.finalBattleService.selectTarget(action.actionId);
    }
  }

  onSelectReserveTarget(reserveHeroId: string): void {
    const action = (this.vm.data?.actions ?? []).find(
      (entry) =>
        entry.actionCode === 'SWAP' &&
        entry.outgoingHeroId === this.vm.selectedHeroId &&
        entry.incomingHeroId === reserveHeroId,
    );
    if (action) {
      this.finalBattleService.setActionCode('SWAP');
      this.finalBattleService.selectTarget(action.actionId);
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
    return this.i18nService.t(key as AppCopyKey);
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

  private updateNarrativeScroll(index: number | null): void {
    const el = this.narrativeLogContainer?.nativeElement;
    if (!el) {
      this.previousEventsCount = 0;
      this.followNarrative = true;
      this.narrativeScrollTop = 0;
      return;
    }
    const entry =
      index === null ? null : el.querySelectorAll<HTMLElement>('.event-list > li')[index];
    if (entry && this.followNarrative) {
      this.narrativeScrollTop =
        el.scrollTop +
        entry.getBoundingClientRect().top -
        el.getBoundingClientRect().top -
        el.clientTop;
    }
    el.scrollTop = this.narrativeScrollTop;
    this.narrativeScrollTop = el.scrollTop;
  }
}
