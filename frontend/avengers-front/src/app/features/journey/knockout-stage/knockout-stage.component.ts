import { Component, OnInit } from '@angular/core';
import { KnockoutStageService } from './service/knockout-stage.service';
import { KnockoutStageCodeEnum } from './model/knockout-stage-code.enum';
import { KnockoutStageViewModel } from './model/knockout-stage-view-model.interface';
import { AppCopyKey, I18nService } from '../../../core/services/i18n.service';
import {
  KnockoutTeamApi,
  KnockoutRoundApi,
  KnockoutEncounterSummaryApi,
  KnockoutMatchApi,
} from './model/knockout-stage-api.interface';

@Component({
  selector: 'app-knockout-stage',
  templateUrl: './knockout-stage.component.html',
  styleUrls: ['./knockout-stage.component.css'],
  standalone: false,
})
export class KnockoutStageComponent implements OnInit {
  readonly stageTabs: { code: KnockoutStageCodeEnum; key: AppCopyKey }[] = [
    { code: KnockoutStageCodeEnum.ROUND_OF_16, key: 'r6.roundOf16' },
    { code: KnockoutStageCodeEnum.QUARTERFINAL, key: 'r6.quarterfinal' },
    { code: KnockoutStageCodeEnum.SEMIFINAL, key: 'r6.semifinal' },
    { code: KnockoutStageCodeEnum.FINAL_STAGE, key: 'r6.final' },
  ];

  constructor(
    private readonly knockoutStageService: KnockoutStageService,
    private readonly i18nService: I18nService,
  ) {}

  get pageState(): KnockoutStageViewModel {
    return this.knockoutStageService.getViewModel();
  }

  getTeam(teamId: string | null | undefined): KnockoutTeamApi | undefined {
    if (!teamId || !this.pageState.data?.teams) {
      return undefined;
    }
    return this.pageState.data.teams.find((team) => team.teamId === teamId);
  }

  getTeamLeaderId(teamId: string | null | undefined): string {
    return this.getTeam(teamId)?.leaderId ?? '';
  }

  get currentRound(): KnockoutRoundApi | undefined {
    return this.pageState.data?.stages?.knockout?.rounds.find(
      (round) => round.stageCode === this.pageState.selectedStage,
    );
  }

  getEncounterSummary(encounterId: string): KnockoutEncounterSummaryApi | undefined {
    return this.pageState.data?.encounters?.encounters?.find(
      (encounter) => encounter.encounterId === encounterId,
    );
  }

  getTeamDamage(summary: KnockoutEncounterSummaryApi | undefined, teamId: string): number {
    const record = summary?.damageByTeam?.find((damage) => damage.teamId === teamId);
    return record ? record.damageDealt : 0;
  }

  get isFinalStage(): boolean {
    return this.pageState.selectedStage === KnockoutStageCodeEnum.FINAL_STAGE;
  }

  get finalists(): { playerTeam?: KnockoutTeamApi; opponentTeam?: KnockoutTeamApi } {
    const ids = this.pageState.data?.stages?.finalists;
    return {
      playerTeam: this.getTeam(ids?.playerTeamId),
      opponentTeam: this.getTeam(ids?.opponentTeamId),
    };
  }

  get isFinalPending(): boolean {
    const finalEncounter = this.pageState.data?.encounters?.encounters?.find(
      (encounter) => (encounter.stageCode as string) === KnockoutStageCodeEnum.FINAL_STAGE,
    );
    if (!finalEncounter || !finalEncounter.winnerTeamId) {
      return true;
    }
    return false;
  }

  ngOnInit(): void {
    this.knockoutStageService.initialize();
  }

  retry(): void {
    this.knockoutStageService.initialize();
  }

  translate(key: AppCopyKey, params: Record<string, string | number> = {}): string {
    return this.i18nService.t(key, params);
  }

  onStageSelect(stage: KnockoutStageCodeEnum): void {
    this.knockoutStageService.setSelectedStage(stage);
  }

  trackMatch(_index: number, match: KnockoutMatchApi): string {
    return match.encounterId;
  }

  getPortraitPath(heroId: string | null | undefined): string {
    return this.knockoutStageService.portraitPath(heroId);
  }

  imageError(event: Event): void {
    this.knockoutStageService.imageError(event);
  }
}
