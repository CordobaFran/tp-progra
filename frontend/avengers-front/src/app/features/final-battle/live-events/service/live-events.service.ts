import { Injectable } from '@angular/core';
import { toApiError } from '../../../../core/models/api-error.interface';
import { AppContextService } from '../../../../core/services/app-context.service';
import { ApiService } from '../../../../core/services/api.service';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { LiveEventsStateModel, LiveEventsViewModel } from '../model/live-events.model';

@Injectable({ providedIn: 'root' })
export class LiveEventsService extends BaseApiService {
  private readonly pageState: LiveEventsViewModel = {
    status: 'loading',
    error: null,
    errorCode: null,
    data: null,
    lang: 'en',
  };

  constructor(
    api: ApiService,
    private readonly appContext: AppContextService,
  ) {
    super(api);
  }

  getViewModel(): LiveEventsViewModel {
    return this.pageState;
  }

  initialize(): void {
    this.refresh();
  }

  refresh(): void {
    this.pageState.lang = this.appContext.getCurrentLang();
    this.pageState.status = 'loading';
    this.pageState.error = null;
    this.pageState.errorCode = null;
    this.pageState.data = null;
    this.getData<LiveEventsStateModel>('/final-stage/events').subscribe({
      next: (data) => {
        this.pageState.data = data;
        this.pageState.status =
          data.status === 'UNAVAILABLE' || !data.events.length ? 'empty' : 'data';
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