import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { AppCopyKey, I18nService } from '../../../../core/services/i18n.service';
import {
  FinalNarrativeViewModel,
  FinalStageEventApi,
  FinalStageEventValues,
} from './model/final-narrative.model';

interface PublishedFact {
  key: keyof FinalStageEventValues;
  label: AppCopyKey;
  value: string | number;
}

interface NarrativeEventView {
  event: FinalStageEventApi;
  facts: PublishedFact[];
}

const FACT_LABELS: Record<keyof FinalStageEventValues, AppCopyKey> = {
  actorIdentityId: 'r9.actor',
  actorHeroId: 'r9.actor',
  actorSideCode: 'r10.actorSideCode',
  targetHeroIds: 'r9.target',
  targetId: 'r9.target',
  targetHeroId: 'r9.target',
  amount: 'r10.amount',
  damage: 'r10.damage',
  healing: 'r10.healing',
  apChange: 'r10.apChange',
  abilityPoints: 'r10.abilityPoints',
  energy: 'r10.energy',
  actionName: 'r10.action',
  actionCode: 'r10.actionCode',
  strategyCode: 'r10.strategyCode',
  itemName: 'r10.itemName',
  effectCode: 'r10.effectCode',
  statCode: 'r10.statCode',
  targetSideCode: 'r10.targetSideCode',
  revealedIdentityId: 'r10.revealedIdentityId',
  previousIdentityId: 'r10.previousIdentityId',
  speakerTeamId: 'r10.speakerTeamId',
  playerTeamId: 'r10.playerTeamId',
  opponentTeamId: 'r10.opponentTeamId',
  alignmentCode: 'r10.alignmentCode',
  nextNormalTurn: 'r10.nextNormalTurn',
  percent: 'r10.percent',
  duration: 'r10.duration',
};

@Component({
  selector: 'app-final-narrative',
  templateUrl: './final-narrative.component.html',
  styleUrls: ['./final-narrative.component.css'],
  standalone: false,
})
export class FinalNarrativeComponent implements OnChanges {
  @Input() view: FinalNarrativeViewModel = {
    status: 'loading',
    error: null,
    lang: 'es',
    state: null,
    events: [],
  };

  @Output() retry = new EventEmitter<void>();

  orderedEvents: NarrativeEventView[] = [];

  constructor(private readonly i18n: I18nService) {}

  ngOnChanges(): void {
    if (this.view.status === 'loading' || this.view.status === 'error' || !this.view.state) {
      this.orderedEvents = [];
      return;
    }
    this.orderedEvents = [...this.view.events]
      .sort((a, b) => a.sequence - b.sequence)
      .map((event) => ({
        event: {
          ...event,
          narrative:
            event.narrative === null
              ? null
              : {
                  lines: [...event.narrative.lines].sort((a, b) => a.lineSequence - b.lineSequence),
                },
        },
        facts: this.publishedFacts(event.values),
      }));
  }

  translate(key: AppCopyKey, params: Record<string, string | number> = {}): string {
    return this.i18n.translate(key, this.view.lang, params);
  }

  requestRetry(): void {
    this.retry.emit();
  }

  trackEvent(_index: number, entry: NarrativeEventView): number {
    return entry.event.sequence;
  }

  trackFact(_index: number, fact: PublishedFact): keyof FinalStageEventValues {
    return fact.key;
  }

  private publishedFacts(values: FinalStageEventValues): PublishedFact[] {
    return (Object.keys(FACT_LABELS) as (keyof FinalStageEventValues)[]).flatMap((key) => {
      const value = values[key];
      if (Array.isArray(value)) {
        return value.length ? [{ key, label: FACT_LABELS[key], value: value.join(', ') }] : [];
      }
      return typeof value === 'number' || (typeof value === 'string' && value.length > 0)
        ? [{ key, label: FACT_LABELS[key], value }]
        : [];
    });
  }
}
