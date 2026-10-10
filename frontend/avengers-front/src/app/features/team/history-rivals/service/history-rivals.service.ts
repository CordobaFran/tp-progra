import { Injectable } from '@angular/core';
import { toApiError } from '../../../../core/models/api-error.interface';
import { ApiService } from '../../../../core/services/api.service';
import { AppContextService } from '../../../../core/services/app-context.service';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { HistoryRivalsApi } from '../model/history-rivals-api.interface';
import { HistoryRivalsViewModel } from '../model/history-rivals-view-model.interface';

@Injectable({ providedIn: 'root' })
export class HistoryRivalsService extends BaseApiService {
  private readonly pageState: HistoryRivalsViewModel = {
    status: 'loading',
    error: null,
    errorCode: null,
    data: null,
    lang: 'en',
  };

  constructor(
    api: ApiService,
    private readonly appContextService: AppContextService,
  ) {
    super(api);
  }

  getViewModel(): HistoryRivalsViewModel {
    return this.pageState;
  }

  initialize(): void {
    this.pageState.lang = this.appContextService.getCurrentLang();
    this.pageState.status = 'loading';
    this.pageState.error = null;
    this.pageState.errorCode = null;

    this.getData<HistoryRivalsApi>('/my-team/history-rivals').subscribe({
      next: (data) => {
        this.pageState.data = data;
        this.pageState.status = data.heroes.length ? 'data' : 'empty';
      },
      error: (error: unknown) => {
        const apiError = toApiError(error);
        this.pageState.status = 'error';
        this.pageState.error = apiError.message;
        this.pageState.errorCode = apiError.messageCode;
      },
    });
  }
}
