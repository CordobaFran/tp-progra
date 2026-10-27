import { Injectable } from '@angular/core';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { KnockoutStageViewModel } from '../model/knockout-stage-view-model.interface';
import { KnockoutStageCodeEnum } from '../model/knockout-stage-code.enum';
import { ApiService } from '../../../../core/services/api.service';
import { KnockoutStageApi } from '../model/knockout-stage-api.interface';
import { toApiError } from '../../../../core/models/api-error.interface';
import { HeroArtworkResolverService } from '../../../../core/services/hero-artwork-resolver.service';

@Injectable({ providedIn: 'root' })
export class KnockoutStageService extends BaseApiService {
  private readonly pageState: KnockoutStageViewModel = {
    status: 'loading',
    error: null,
    errorCode: null,
    data: null,
    selectedStage: KnockoutStageCodeEnum.ROUND_OF_16,
  };

  constructor(
    api: ApiService,
    private readonly artwork: HeroArtworkResolverService,
  ) {
    super(api);
  }

  getViewModel(): KnockoutStageViewModel {
    return this.pageState;
  }

  initialize(): void {
    this.loadKnockoutStage();
  }

  setSelectedStage(stage: KnockoutStageCodeEnum): void {
    this.pageState.selectedStage = stage;
  }

  loadKnockoutStage(): void {
    this.pageState.status = 'loading';
    this.pageState.error = null;
    this.pageState.errorCode = null;

    this.getData<KnockoutStageApi>('/journey/knockout-stage').subscribe({
      next: (data) => {
        this.pageState.data = data;
        const rounds = data?.stages?.knockout?.rounds;
        const hasTournament = Boolean(rounds && rounds.length > 0);
        this.pageState.status = hasTournament ? 'data' : 'empty';
      },
      error: (error: unknown) => {
        const apiError = toApiError(error);
        this.pageState.status = 'error';
        this.pageState.error = apiError.message;
        this.pageState.errorCode = apiError.messageCode;
      },
    });
  }

  portraitPath(heroId: string | null | undefined): string {
    if (!heroId) {
      return '';
    }
    return this.artwork.portraitPath(heroId);
  }

  imageError(event: Event): void {
    this.artwork.useFallback(event);
  }
}
