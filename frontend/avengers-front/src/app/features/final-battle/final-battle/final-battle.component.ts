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

export interface FormattedNarrativeEvent {
  turn?: number;
  message: string;
}

interface RawNarrativeEvent {
  turn?: number;
  message?: string;
  text?: string;
  messageCode?: string;
  narrative?: {
    lines?: Array<{ text?: string }>;
  };
}

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

  constructor(
    private readonly finalBattleService: FinalBattleService,
    private readonly i18nService: I18nService,
    private readonly artwork: HeroArtworkResolverService,
  ) {}

  ngOnInit(): void {
    this.finalBattleService.initialize();
  }

  ngAfterViewChecked(): void {
    const currentCount = this.formattedNarrativeEvents.length;
    if (currentCount > this.previousEventsCount) {
      this.previousEventsCount = currentCount;
      this.scrollToBottom();
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
    return this.vm.data?.state?.turn ?? 0;
  }

  get currentPhase(): string {
    return this.vm.data?.state?.phase ?? '';
  }

  get currentStrategy(): string {
    return this.vm.data?.teams?.player?.strategyCode || this.playerSide?.strategyCode || 'BALANCED';
  }

  get formattedNarrativeEvents(): FormattedNarrativeEvent[] {
    const rawEvents: readonly RawNarrativeEvent[] =
      (this.vm.data?.events as RawNarrativeEvent[] | undefined) ?? [];

    let maxTurn = 1;

    return rawEvents
      .map((evt: RawNarrativeEvent): FormattedNarrativeEvent => {
        const textFromLines = evt.narrative?.lines?.[0]?.text;
        const directMessage = evt.message || evt.text;
        const translatedMsg = evt.messageCode ? this.translate(evt.messageCode) : '';
        const message = textFromLines || directMessage || translatedMsg || '';

        const rawTurn = evt.turn ?? maxTurn;
        if (rawTurn > maxTurn) {
          maxTurn = rawTurn;
        }

        return {
          turn: maxTurn,
          message,
        };
      })
      .filter((e: FormattedNarrativeEvent) => Boolean(e.message));
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
    const actions: FinalBattleLegalAction[] = this.vm.data?.actions ?? [];
    return Array.from(
      new Set(actions.filter((a) => a.actionCode === 'TEAM_ACTION').map((a) => a.actionCode)),
    );
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
    const actions: FinalBattleLegalAction[] = this.vm.data?.actions ?? [];
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
      return a.targetHeroId === heroId || a.incomingHeroId === heroId;
    });
  }

  get isTeamActionSelected(): boolean {
    if (!this.vm.actionCode) {
      return false;
    }
    if (this.vm.actionCode === 'TEAM_ACTION') {
      return true;
    }

    const actionDesc = this.getActionDescriptor(this.vm.actionCode);
    if (actionDesc?.targetScope === 'TEAM') {
      return true;
    }

    const sel = this.selectedAction;
    return sel?.targetScope === 'TEAM';
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
    if (!this.requiresTarget) {
      return '';
    }

    if (this.isTeamActionSelected) {
      return this.translate('r9.opponent');
    }

    const sel = this.selectedAction;
    if (!sel) {
      return '';
    }

    if (sel.actionCode === 'SWAP') {
      const targetId = sel.incomingHeroId || sel.targetHeroId;
      const hero = this.playerSide?.reserveHeroes.find((h) => h.id === targetId);
      return hero?.displayName || targetId || '';
    }

    const targetId = sel.targetHeroId;
    if (targetId) {
      const hero = this.opponentSide?.activeHeroes.find((h) => h.id === targetId);
      return hero?.displayName || targetId;
    }

    return '';
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
    if (this.isTeamActionSelected) {
      return true;
    }
    const sel = this.selectedAction;
    return sel?.targetHeroId === heroId;
  }

  canExecute(): boolean {
    if (!this.vm.data || this.vm.submitting) {
      return false;
    }

    if (this.selectedAction?.actionCode === 'CHANGE_STRATEGY') {
      return true;
    }

    if (this.vm.actionCode === 'TEAM_ACTION' || this.selectedAction?.targetScope === 'TEAM') {
      return Boolean(this.vm.selectedActionId);
    }

    return Boolean(this.vm.selectedActionId);
  }

  onSelectTab(tab: 'abilities' | 'inventory'): void {
    this.finalBattleService.setTab(tab);
  }

  onSelectHero(hero: FinalBattleHero): void {
    this.finalBattleService.selectHero(hero.id);
  }

  onSelectActionCode(code: string): void {
    this.finalBattleService.setActionCode(code);

    const actionDesc = this.getActionDescriptor(code);
    const isTeamScope = code === 'TEAM_ACTION' || actionDesc?.targetScope === 'TEAM';

    if (isTeamScope) {
      const actions: FinalBattleLegalAction[] = this.vm.data?.actions ?? [];
      const teamAction = actions.find((a: FinalBattleLegalAction) => {
        if (code === 'TEAM_ACTION') {
          return a.actionCode === 'TEAM_ACTION' || a.targetScope === 'TEAM';
        }
        return (
          a.actionCode === code &&
          (!this.vm.selectedHeroId || a.actorHeroId === this.vm.selectedHeroId)
        );
      });

      if (teamAction) {
        this.finalBattleService.selectTarget(teamAction.actionId);
      }
    }
  }

  onSelectHeroTarget(heroId: string): void {
    const matchingAction = this.legalTargetsForSelectedAction.find((a) => {
      return a.targetHeroId === heroId;
    });
    if (matchingAction) {
      this.finalBattleService.selectTarget(matchingAction.actionId);
    }
  }

  onSelectReserveTarget(reserveHeroId: string): void {
    const actions: FinalBattleLegalAction[] = this.vm.data?.actions ?? [];
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

  private scrollToBottom(): void {
    if (this.narrativeLogContainer?.nativeElement) {
      const el = this.narrativeLogContainer.nativeElement;
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth',
      });
    }
  }
}
