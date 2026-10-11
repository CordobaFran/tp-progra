import { Injectable } from '@angular/core';
import { BaseApiService } from 'src/app/core/services/base-api.service';
import { KnockoutStageViewModel } from '../model/knockout-stage-view-model.interface';
import { KnockoutStageCodeEnum } from '../model/knockout-stage-code.enum';
import { ApiService } from 'src/app/core/services/api.service';
import { KnockoutStageApi } from '../model/knockout-stage-api.interface';
import { toApiError } from 'src/app/core/models/api-error.interface';

@Injectable({ providedIn: 'root' })
export class KnockoutStageService extends BaseApiService {
  private readonly pageState: KnockoutStageViewModel = {
    status: 'loading',
    error: null,
    errorCode: null,
    data: null,
    selectedStage: KnockoutStageCodeEnum.ROUND_OF_16,
  };

  constructor(api: ApiService) {
    super(api);
  }

  getViewModel(): KnockoutStageViewModel {
    return this.pageState;
  }

  initialize(): void {
    this.loadKnockoutStage();
  }

  loadKnockoutStage(): void {
    this.pageState.status = 'loading';
    this.pageState.error = null;
    this.pageState.errorCode = null;

    this.getData<KnockoutStageApi>('/journey/knockout-stage').subscribe({
      next: (data) => {
        this.pageState.data = data;
        this.pageState.status = data ? 'data' : 'empty';
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
