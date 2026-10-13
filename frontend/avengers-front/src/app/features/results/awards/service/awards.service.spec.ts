import { of, Subject, throwError } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { ApiError } from '../../../../core/models/api-error.interface';
import { ResponseObject } from '../../../../core/models/response-object.interface';
import { AwardsModel } from '../model/awards.model';
import { AwardsService } from './awards.service';

const data: AwardsModel = {
  attemptId: 'completed-tournament',
  language: 'es',
  status: 'COMPLETED',
  completionOutcome: 'ABANDON',
  endingCode: 'ABANDON',
  terminalReasonCode: 'PLAYER_ABANDONED',
  completedAt: '2026-10-12T12:00:00Z',
  configuredTeamId: 'hulk',
  heroNames: { hulk: 'Hulk' },
  teamNames: { hulk: 'Equipo Hulk' },
  eligibility: { minimumStageCode: 'QUARTERFINAL', eligibleTeamIds: ['hulk'] },
  competition: { journeyEncounters: 62, finalStagePlayed: false, finalStageNormalTurnsPlayed: 0 },
  teamStatistics: [],
  heroStatistics: [],
  awards: [],
};
const envelope: ResponseObject<AwardsModel> = {
  success: true,
  serverTime: '',
  responseMessage: { messageCode: '0000', message: 'OK' },
  data,
};

describe('AwardsService', () => {
  it('requests the current BFF endpoint and preserves the official data', () => {
    const get = jasmine.createSpy('get').and.returnValue(of(envelope));
    const service = new AwardsService({ get } as unknown as ApiService);
    service.initialize();
    expect(get).toHaveBeenCalledWith('/results/awards', undefined);
    expect(service.getViewModel().status).toBe('data');
    expect(service.getViewModel().data).toBe(data);
  });

  it('requests a historical attempt via the BFF', () => {
    const get = jasmine.createSpy('get').and.returnValue(of(envelope));
    const service = new AwardsService({ get } as unknown as ApiService);
    service.initialize('completed-tournament');
    expect(get).toHaveBeenCalledWith('/results/awards/completed-tournament', undefined);
  });

  for (const code of ['JOURNEY_REQUIRED', 'STATISTICS_UNAVAILABLE']) {
    it(`treats ${code} as pending results instead of a failed application`, () => {
      const service = new AwardsService({
        get: () => throwError(() => new ApiError(code, 'Pending')),
      } as unknown as ApiService);
      service.initialize();
      expect(service.getViewModel().status).toBe('empty');
      expect(service.getViewModel().errorCode).toBe(code);
      expect(service.getViewModel().data).toBeNull();
    });
  }

  it('keeps transport failures retryable and does not show stale results', () => {
    const get = jasmine.createSpy('get').and.returnValues(
      of(envelope),
      throwError(() => new ApiError('AWARDS_UNAVAILABLE', 'Connection failed')),
      of(envelope),
    );
    const service = new AwardsService({ get } as unknown as ApiService);
    service.initialize();
    service.initialize();
    expect(service.getViewModel().status).toBe('error');
    expect(service.getViewModel().data).toBeNull();
    service.initialize();
    expect(service.getViewModel().status).toBe('data');
  });

  it('cancels previous requests and subscriptions on leaving the view', () => {
    const first = new Subject<ResponseObject<AwardsModel>>();
    const second = new Subject<ResponseObject<AwardsModel>>();
    const get = jasmine.createSpy('get').and.returnValues(first, second);
    const service = new AwardsService({ get } as unknown as ApiService);
    service.initialize('old-tournament');
    service.initialize();
    expect(first.observed).toBeFalse();
    first.next(envelope);
    expect(service.getViewModel().status).toBe('loading');
    second.next(envelope);
    expect(service.getViewModel().status).toBe('data');
    service.dispose();
    expect(second.observed).toBeFalse();
  });
});
