import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { toApiError } from '../../../../core/models/api-error.interface';
import { ApiService } from '../../../../core/services/api.service';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { AwardsModel } from '../model/awards.model';
import { AwardsViewModel } from '../model/awards-view-model.interface';

@Injectable()
export class AwardsService extends BaseApiService {
  private request?: Subscription;

  private readonly pageState: AwardsViewModel = {
    status: 'loading',
    data: null,
    error: null,
    errorCode: null,
  };

  constructor(api: ApiService) {
    super(api);
  }

  getViewModel(): AwardsViewModel {
    return this.pageState;
  }

  initialize(attemptId?: string): void {
    this.request?.unsubscribe();
    Object.assign(this.pageState, { status: 'loading', data: null, error: null, errorCode: null });
    const path = '/results/awards' + (attemptId ? `/${encodeURIComponent(attemptId)}` : '');
    this.request = this.getData<AwardsModel>(path).subscribe({
      next: (data) => {
        this.pageState.data = data;
        this.pageState.status = 'data';
      },
      error: (error: unknown) => {
        const apiError = toApiError(error);
        const messages: Record<string, string> = {
          JOURNEY_REQUIRED:
            'Todavía no hay un torneo. Configurá el equipo y simulá el camino para comenzar.',
          STATISTICS_UNAVAILABLE:
            'El torneo todavía no terminó. Las estadísticas y los premios se habilitan al finalizar la Batalla Final, incluso por derrota o abandono.',
        };
        this.pageState.errorCode = apiError.messageCode;
        const pendingMessage = messages[apiError.messageCode ?? ''];
        this.pageState.status = pendingMessage ? 'empty' : 'error';
        this.pageState.error = pendingMessage ?? apiError.message;
      },
    });
  }

  dispose(): void {
    this.request?.unsubscribe();
  }
}
