import { Component, OnInit } from '@angular/core';
import { AppCopyKey, AppLanguage, I18nService } from '../../../core/services/i18n.service';
import {
  HistoryRivalsEncounter,
  HistoryRivalsHero,
  HistoryRivalsResult,
} from './model/history-rivals-api.interface';
import { HistoryRivalsViewModel } from './model/history-rivals-view-model.interface';
import { HistoryRivalsService } from './service/history-rivals.service';

const STAGE_COPY: Record<string, AppCopyKey> = {
  GROUP_STAGE: 'historyRivals.stage.groupStage',
  ROUND_OF_16: 'historyRivals.stage.roundOf16',
  QUARTERFINAL: 'historyRivals.stage.quarterfinal',
  SEMIFINAL: 'historyRivals.stage.semifinal',
};

const RESULT_COPY: Record<HistoryRivalsResult, AppCopyKey> = {
  WIN: 'historyRivals.victory',
  DRAW: 'historyRivals.draw',
  LOSS: 'historyRivals.defeat',
};

@Component({
  selector: 'app-history-rivals',
  templateUrl: './history-rivals.component.html',
  styleUrls: ['./history-rivals.component.css'],
  standalone: false,
})
export class HistoryRivalsComponent implements OnInit {
  constructor(
    private readonly historyRivalsService: HistoryRivalsService,
    private readonly i18nService: I18nService,
  ) {}

  get pageState(): HistoryRivalsViewModel {
    return this.historyRivalsService.getViewModel();
  }

  get selectedHero(): HistoryRivalsHero | null {
    return this.historyRivalsService.selectedHero();
  }

  ngOnInit(): void {
    this.historyRivalsService.initialize();
  }

  onHeroSelect(heroId: string): void {
    this.historyRivalsService.selectHero(heroId);
  }

  onRivalSelect(rivalId: string): void {
    this.historyRivalsService.selectRival(rivalId);
  }

  onJourneyChange(journeyId: string): void {
    this.historyRivalsService.selectJourney(journeyId);
  }

  retry(): void {
    this.historyRivalsService.initialize();
  }

  translate(key: AppCopyKey, lang: AppLanguage): string {
    return this.i18nService.translate(key, lang);
  }

  stageLabel(encounter: HistoryRivalsEncounter): string {
    const copy = STAGE_COPY[encounter.stageCode];
    const stage = copy ? this.translate(copy, this.pageState.lang) : encounter.stageCode;
    return encounter.groupId ? `${stage} ${encounter.groupId}` : stage;
  }

  resultLabel(result: HistoryRivalsResult): string {
    return this.translate(RESULT_COPY[result], this.pageState.lang);
  }

  winnerName(encounter: HistoryRivalsEncounter): string | null {
    if (encounter.winnerTeamId === encounter.heroTeam.id) {
      return encounter.heroTeam.name;
    }
    return encounter.winnerTeamId === encounter.rivalTeam.id ? encounter.rivalTeam.name : null;
  }

  portraitPath(heroId: string): string {
    return this.historyRivalsService.portraitPath(heroId);
  }

  imageError(event: Event): void {
    this.historyRivalsService.imageError(event);
  }

  trackById(_index: number, item: { id: string }): string {
    return item.id;
  }

  trackEncounter(_index: number, encounter: HistoryRivalsEncounter): string {
    return encounter.encounterId;
  }
}
