import { Component, OnDestroy, OnInit } from '@angular/core';
import { AppCopyKey, I18nService } from '../../../core/services/i18n.service';
import {
  FinalStageEventValues,
  LiveEventModel,
  LiveEventsViewModel,
} from './model/live-events.model';
import { LiveEventsService } from './service/live-events.service';

@Component({
  selector: 'app-live-events',
  templateUrl: './live-events.component.html',
  styleUrls: ['./live-events.component.css'],
  standalone: false,
})
export class LiveEventsComponent implements OnInit, OnDestroy {
  private readonly introAudio = new Audio('assets/audio/live-events-intro.mp3');

  constructor(
    private readonly liveEvents: LiveEventsService,
    private readonly i18n: I18nService,
  ) {}

  get pageState(): LiveEventsViewModel {
    return this.liveEvents.getViewModel();
  }

  ngOnInit(): void {
    this.liveEvents.initialize();
    this.introAudio.play().catch(() => undefined);
  }

  ngOnDestroy(): void {
    this.introAudio.pause();
    this.introAudio.currentTime = 0;
  }

  refresh(): void {
    this.liveEvents.refresh();
  }

  translate(key: AppCopyKey, params: Record<string, string | number> = {}): string {
    return this.i18n.translate(key, this.pageState.lang, params);
  }

  publishedFacts(event: LiveEventModel): { label: string; value: string | number }[] {
    const fields: Partial<Record<keyof FinalStageEventValues, AppCopyKey>> = {
      actionCode: 'r10.actionCode',
      strategyCode: 'r10.strategyCode',
      itemName: 'r10.itemName',
      effectCode: 'r10.effectCode',
      statCode: 'r10.statCode',
      actorSideCode: 'r10.actorSideCode',
      targetSideCode: 'r10.targetSideCode',
      revealedIdentityId: 'r10.revealedIdentityId',
      previousIdentityId: 'r10.previousIdentityId',
      speakerTeamId: 'r10.speakerTeamId',
      playerTeamId: 'r10.playerTeamId',
      opponentTeamId: 'r10.opponentTeamId',
      alignmentCode: 'r10.alignmentCode',
      nextNormalTurn: 'r10.nextNormalTurn',
    };
    return (Object.keys(fields) as (keyof FinalStageEventValues)[]).flatMap((key) => {
      const value = event.values[key];
      const label = fields[key];
      return label && (typeof value === 'string' || typeof value === 'number')
        ? [{ label: this.translate(label), value }]
        : [];
    });
  }

  trackEvent(_index: number, event: LiveEventModel): number {
    return event.sequence;
  }
}
