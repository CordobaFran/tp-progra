import { Injectable } from '@angular/core';
import { BaseApiService } from 'src/app/core/services/base-api.service';
import {
  HistoryDetailResponse,
  HistoryListResponse,
  HistoryViewModel,
} from '../model/history-view-model.interface';
import { ApiService } from 'src/app/core/services/api.service';
import { ApiError, toApiError } from 'src/app/core/models/api-error.interface';
import { AppContextService } from 'src/app/core/services/app-context.service';

@Injectable({ providedIn: 'root' })
export class HistoryService extends BaseApiService {
  private readonly pageState: HistoryViewModel = {
    status: 'loading',
    error: null,
    errorCode: null,
    data: null,
    selectedDetail: null,
    viewMode: 'list',
    lang: 'en',
  };

  constructor(
    api: ApiService,
    private readonly appContextService: AppContextService
  ) {
    super(api)
  }

  getViewModel(): HistoryViewModel {
    return this.pageState;
  }

  initialize(): void {
    this.pageState.lang = this.appContextService.getCurrentLang();
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
      error: (error: unknown) => {
        const apiError: ApiError = toApiError(error);
        this.pageState.status = "error";
        this.pageState.error = apiError.message;
        this.pageState.errorCode = apiError.messageCode;
      }
    })
  }

  public loadHistoryDetail(attemptId: string): void {
    this.pageState.status = "loading";
    this.pageState.error = null;
    this.pageState.errorCode = null;

    this.getData<HistoryDetailResponse>(`/results/history/${attemptId}`).subscribe({
      next: (detailData) => {
        if (detailData) {
          this.pageState.selectedDetail = detailData;
          this.pageState.viewMode = "detail";
          this.pageState.status = "data";
        } else {
          this.pageState.status = "empty";
        }
      },
      error: (error: unknown) => {
        const apiError: ApiError = toApiError(error);
        this.pageState.status = "error";
        this.pageState.error = apiError.message;
        this.pageState.errorCode = apiError.messageCode;
      }
    });
  }

  public resetToListView(): void {
    this.pageState.selectedDetail = null;
    this.pageState.viewMode = 'list';

    if (this.pageState.data) {
      if (this.pageState.data.length > 0) {
        this.pageState.status = 'data';
      }
    }
  }
}