import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { AppContextService } from '../../../../core/services/app-context.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { NarrativeRendererComponent } from '../../../../shared/narrative/narrative-renderer.component';
import { LoadingStateComponent } from '../../../../shared/state/loading-state.component';
import { EmptyStateComponent } from '../../../../shared/state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/state/error-state.component';
import { FinalNarrativeComponent } from './final-narrative.component';
import {
  FinalNarrativeViewModel,
  FinalStageEventApi,
  FinalNarrativeStateModel,
} from './model/final-narrative.model';

function state(): FinalNarrativeStateModel {
  return {
    status: 'READY',
    phase: 'TOURNAMENT_FINAL',
    phaseLabel: 'Final del Torneo',
    normalTurn: 0,
  };
}
function event(sequence: number): FinalStageEventApi {
  return {
    sequence,
    turn: 0,
    phase: 'TOURNAMENT_FINAL',
    eventCode: 'PUBLISHED_EVENT',
    messageCode: 'PUBLISHED_MESSAGE',
    values: {},
    narrative: null,
  };
}

describe('FinalNarrativeComponent', () => {
  let fixture: ComponentFixture<FinalNarrativeComponent>;
  const text = () => fixture.nativeElement.textContent as string;
  const cards = () =>
    fixture.nativeElement.querySelectorAll('.narrative-event') as NodeListOf<HTMLElement>;
  const render = (patch: Partial<FinalNarrativeViewModel> = {}) => {
    fixture.componentRef.setInput('view', {
      status: 'data',
      error: null,
      lang: 'es',
      state: state(),
      events: [],
      ...patch,
    });
    fixture.detectChanges();
  };
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, RouterModule.forRoot([])],
      declarations: [
        FinalNarrativeComponent,
        NarrativeRendererComponent,
        LoadingStateComponent,
        EmptyStateComponent,
        ErrorStateComponent,
      ],
      providers: [
        I18nService,
        { provide: AppContextService, useValue: { current: { language: 'es' } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(FinalNarrativeComponent);
  });

  it('shows loading and hides the previous snapshot', () => {
    render({ status: 'loading', events: [event(1)] });
    expect(fixture.nativeElement.querySelector('app-loading-state')).not.toBeNull();
    expect(cards().length).toBe(0);
    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeNull();
  });
  it('distinguishes no Journey from an API error', () => {
    render({ status: 'empty', state: null });
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('/journey/simulate');
    expect(fixture.nativeElement.querySelector('app-error-state')).toBeNull();
  });
  it('shows READY with no events and keeps turn zero', () => {
    render();
    expect(fixture.nativeElement.querySelector('app-empty-state')).not.toBeNull();
    expect(text()).toContain('Final del Torneo');
    expect(text()).toContain('0');
    expect(cards().length).toBe(0);
  });
  it('sorts event and narrative sequences without mutating the input', () => {
    const first = event(1);
    first.narrative = {
      lines: [
        { lineSequence: 2, type: 'DIALOGUE', speakerId: 'doom', text: 'Published dialogue.' },
        { lineSequence: 1, type: 'NARRATION', speakerId: null, text: 'Published narration.' },
      ],
    };
    Object.freeze(first.narrative.lines);
    const events = [event(2), first];
    Object.freeze(events);
    render({ events });
    expect(fixture.componentInstance.orderedEvents.map((e) => e.event.sequence)).toEqual([1, 2]);
    expect(events[0].sequence).toBe(2);
    expect(first.narrative.lines[0].lineSequence).toBe(2);
    expect(cards()[0].textContent!.indexOf('Published narration.')).toBeLessThan(
      cards()[0].textContent!.indexOf('Published dialogue.'),
    );
    expect(cards()[0].textContent).toContain('doom');
  });
  it('keeps mechanical events without narrative and published zero/negative values', () => {
    const mechanical = event(1);
    mechanical.values = {
      damage: 0,
      apChange: -2,
      percent: 0,
      duration: 3,
      targetHeroIds: ['thor', 'hulk'],
    };
    render({ events: [mechanical] });
    expect(cards().length).toBe(1);
    expect(
      Array.from(fixture.nativeElement.querySelectorAll('dd') as NodeListOf<HTMLElement>).map((e) =>
        e.textContent!.trim(),
      ),
    ).toEqual(['thor, hulk', '0', '-2', '0', '3']);
    expect(fixture.nativeElement.querySelector('app-narrative-renderer')).toBeNull();
  });
  it('shows API error code and emits one retry instead of showing an empty log', () => {
    render({
      status: 'error',
      error: 'Game API unavailable',
      errorCode: 'BFF_FINAL_STAGE_UNAVAILABLE',
      events: [event(1)],
    });
    const retry = spyOn(fixture.componentInstance.retry, 'emit');
    expect(text()).toContain('Game API unavailable');
    expect(text()).toContain('BFF_FINAL_STAGE_UNAVAILABLE');
    expect(cards().length).toBe(0);
    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeNull();
    fixture.nativeElement.querySelector('button').click();
    expect(retry).toHaveBeenCalledTimes(1);
  });
  it('replaces old events when the parent supplies a fresh snapshot', () => {
    render({ events: [event(1), event(2)] });
    render({ events: [event(3)] });
    expect(cards().length).toBe(1);
    expect(fixture.componentInstance.orderedEvents[0].event.sequence).toBe(3);
  });
  it('uses English UI while preserving official narrative text verbatim', () => {
    const published = event(1);
    published.narrative = {
      lines: [
        {
          lineSequence: 1,
          type: 'NARRATION',
          speakerId: null,
          text: 'Exact API narrative — unchanged.',
        },
      ],
    };
    render({ lang: 'en', events: [published] });
    expect(text()).toContain('LIVE BATTLE NARRATIVE');
    expect(text()).toContain('Exact API narrative — unchanged.');
  });
  for (const phase of ['DOOMSDAY', 'FINAL_ATTACK'] as const) {
    it(`renders published ${phase} without anticipating its result`, () => {
      const published = event(1);
      published.phase = phase;
      render({
        state: {
          ...state(),
          status: 'ACTIVE',
          phase,
          phaseLabel: phase,
        },
        events: [published],
      });
      expect(text()).toContain(phase);
      expect(cards().length).toBe(1);
      expect(text()).not.toContain('VICTORY');
    });
  }
  for (const outcome of ['VICTORY', 'DEFEAT', 'ABANDON'] as const) {
    it(`preserves the published ending narrative for ${outcome}`, () => {
      const published = event(1);
      published.phase = 'COMPLETED';
      published.narrative = {
        lines: [
          {
            lineSequence: 1,
            type: 'NARRATION',
            speakerId: null,
            text: `Official ${outcome} ending.`,
          },
        ],
      };
      render({
        state: {
          ...state(),
          status: 'COMPLETED',
          phase: 'COMPLETED',
          phaseLabel: 'Completed',
        },
        events: [published],
      });
      expect(text()).toContain(`Official ${outcome} ending.`);
    });
  }
  it('renders a special ending only when present in published events', () => {
    const published = event(1);
    published.eventCode = 'SUE_STORM_APPEAL';
    published.narrative = {
      lines: [
        {
          lineSequence: 1,
          type: 'DIALOGUE',
          speakerId: 'invisible-woman',
          text: 'Published special ending.',
        },
      ],
    };
    render({ events: [published] });
    expect(text()).toContain('Published special ending.');
    render();
    expect(text()).not.toContain('Published special ending.');
  });
});
