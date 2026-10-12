import { Injectable } from '@angular/core';
import { BaseApiService } from 'src/app/core/services/base-api.service';
import {
  HistoryListResponse,
  HistoryViewModel,
} from '../model/history-view-model.interface';
import { ApiService } from 'src/app/core/services/api.service';
import { ApiError, toApiError } from 'src/app/core/models/api-error.interface';

@Injectable({ providedIn: 'root' })
export class HistoryService extends BaseApiService {
  private readonly pageState: HistoryViewModel = {
    status: 'loading',
    error: null,
    errorCode: null,
    data: null,
    lang: 'en',
  };

  constructor(
    api: ApiService,
  ) {
    super(api)
  }

  getViewModel(): HistoryViewModel {
    return this.pageState;
  }

  initialize(): void {
    this.loadHistoryList()
  }

  private loadHistoryList(): void {
    this.pageState.status = "loading";
    this.pageState.error = null;
    this.pageState.errorCode = null;
    this.getData<HistoryListResponse>('/results/history').subscribe({
      next: (data) => {
        if (data && data.items) {
          this.pageState.data = data.items;
        } else {
          this.pageState.data = [];
        }

        if (this.pageState.data.length > 0) {
          this.pageState.status = "data";
        } else {
          this.pageState.status = "empty";
        }
      },
      error:(error: unknown) => {
        const apiError: ApiError = toApiError(error);
        this.pageState.status = "error";
        this.pageState.error = apiError.message;
        this.pageState.errorCode = apiError.messageCode;
      }
    })
  }
}
