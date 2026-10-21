import { Observable, Subject, of, throwError } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { AppContextService } from '../../../../core/services/app-context.service';
import { HeroArtworkResolverService } from '../../../../core/services/hero-artwork-resolver.service';
import {
  HistoryRivalsApi,
  HistoryRivalsEncountersApi,
} from '../model/history-rivals-api.interface';
import { HistoryRivalsService } from './history-rivals.service';

describe('HistoryRivalsService', () => {
  const teamData: HistoryRivalsApi = {
    teamId: 'alpha',
    heroes: [
      { id: 'beta', displayName: 'Beta', leader: false, active: true, rivals: [] },
      {
        id: 'alpha',
        displayName: 'Alpha',
        leader: true,
        active: true,
        rivals: [
          { id: 'zeta', displayName: 'Zeta' },
          { id: 'omega', displayName: 'Omega' },
        ],
      },
      {
        id: 'gamma',
        displayName: 'Gamma',
        leader: false,
        active: false,
        rivals: [{ id: 'delta', displayName: 'Delta' }],
      },
    ],
    currentJourney: { attemptId: 'attempt-current', status: 'PRE_FINAL' },
    completedJourneys: [
      {
        attemptId: 'attempt-old',
        completedAt: '2026-10-01T10:00:00.000Z',
        outcome: 'VICTORY',
        opponentFinalistName: 'Rival Team',
      },
    ],
  };

  const encountersData: HistoryRivalsEncountersApi = {
    attemptId: 'attempt-current',
    encounters: [
      {
        encounterId: 'encounter-1',
        stageCode: 'GROUP_STAGE',
        groupId: 'A',
        heroTeam: { id: 'alpha', name: 'Alpha Team' },
        rivalTeam: { id: 'generated-1', name: 'Zeta Team' },
        winnerTeamId: 'alpha',
        heroTeamResult: 'WIN',
        heroTeamDamage: 120,
        rivalTeamDamage: 80,
      },
    ],
  };

  const envelope = <T>(payload: T) => ({
    serverTime: '',
    success: true,
    responseMessage: { messageCode: '0000', message: 'OK' },
    data: payload,
  });

  function createService(team: HistoryRivalsApi = teamData) {
    const get = jasmine.createSpy('get').and.callFake((path: string): Observable<unknown> => {
      return of(path === '/my-team/history-rivals' ? envelope(team) : envelope(encountersData));
    });
    const api = { get } as unknown as ApiService;
    const appContext = { getCurrentLang: () => 'en' } as AppContextService;
    return {
      get,
      service: new HistoryRivalsService(api, appContext, new HeroArtworkResolverService()),
    };
  }

  const encounterCalls = (get: jasmine.Spy) =>
    get.calls.allArgs().filter(([path]) => path === '/my-team/history-rivals/encounters');

  it('loads the team, selects the Leader, their first Rival and the current Journey', () => {
    const { get, service } = createService();
    service.initialize();

    const state = service.getViewModel();
    expect(state.status).toBe('data');
    expect(state.selectedHeroId).toBe('alpha');
    expect(state.selectedRivalId).toBe('zeta');
    expect(state.selectedJourneyId).toBe('current');
    expect(encounterCalls(get)).toEqual([
      [
        '/my-team/history-rivals/encounters',
        { heroId: 'alpha', rivalId: 'zeta', attemptId: undefined },
      ],
    ]);
    expect(state.encounters.status).toBe('data');
  });

  it('falls back to the latest completed Journey when there is no current one', () => {
    const { get, service } = createService({ ...teamData, currentJourney: null });
    service.initialize();

    expect(service.getViewModel().selectedJourneyId).toBe('attempt-old');
    expect(encounterCalls(get)[0][1]).toEqual({
      heroId: 'alpha',
      rivalId: 'zeta',
      attemptId: 'attempt-old',
    });
  });

  it('does not ask for encounters when there is no Journey to read', () => {
    const { get, service } = createService({
      ...teamData,
      currentJourney: null,
      completedJourneys: [],
    });
    service.initialize();

    expect(encounterCalls(get).length).toBe(0);
    expect(service.getViewModel().encounters.status).toBe('empty');
  });

  it('moves to the first Rival of the newly selected Hero and reloads the encounters', () => {
    const { get, service } = createService();
    service.initialize();
    service.selectHero('gamma');

    expect(service.getViewModel().selectedRivalId).toBe('delta');
    expect(encounterCalls(get).pop()?.[1]).toEqual({
      heroId: 'gamma',
      rivalId: 'delta',
      attemptId: undefined,
    });
  });

  it('shows an empty state without a request when the selected Hero has no Rivals', () => {
    const { get, service } = createService();
    service.initialize();
    const callsBefore = encounterCalls(get).length;
    service.selectHero('beta');

    expect(service.getViewModel().selectedRivalId).toBeNull();
    expect(service.getViewModel().encounters.status).toBe('empty');
    expect(encounterCalls(get).length).toBe(callsBefore);
  });

  it('reloads with the chosen Rival and the chosen historical Journey', () => {
    const { get, service } = createService();
    service.initialize();
    service.selectRival('omega');
    service.selectJourney('attempt-old');

    expect(encounterCalls(get).pop()?.[1]).toEqual({
      heroId: 'alpha',
      rivalId: 'omega',
      attemptId: 'attempt-old',
    });
  });

  it('reports a failed encounters query without losing the selection', () => {
    const { get, service } = createService();
    service.initialize();
    get.and.returnValue(
      throwError(() => ({
        error: {
          responseMessage: { messageCode: 'BFF_HISTORY_RIVALS_UNAVAILABLE', message: 'Down' },
        },
      })),
    );
    service.selectRival('omega');

    const state = service.getViewModel();
    expect(state.status).toBe('data');
    expect(state.selectedRivalId).toBe('omega');
    expect(state.encounters.status).toBe('error');
    expect(state.encounters.error).toBe('Down');
    expect(state.encounters.errorCode).toBe('BFF_HISTORY_RIVALS_UNAVAILABLE');
  });

  it('reports an error when the team itself cannot be loaded', () => {
    const { get, service } = createService();
    get.and.returnValue(
      throwError(() => ({ error: { responseMessage: { messageCode: 'X', message: 'Broken' } } })),
    );
    service.initialize();

    expect(service.getViewModel().status).toBe('error');
    expect(service.getViewModel().error).toBe('Broken');
  });

  it('ignores a late response from a selection that was replaced', () => {
    const { get, service } = createService();
    service.initialize();

    const late = new Subject<unknown>();
    get.and.returnValue(late);
    service.selectRival('omega');
    get.and.returnValue(of(envelope({ attemptId: 'attempt-current', encounters: [] })));
    service.selectRival('zeta');
    late.next(envelope(encountersData));

    expect(service.getViewModel().selectedRivalId).toBe('zeta');
    expect(service.getViewModel().encounters.status).toBe('empty');
  });
});
