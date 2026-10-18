import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { toApiError } from '../../../../core/models/api-error.interface';
import { ApiService } from '../../../../core/services/api.service';
import { AppContextService } from '../../../../core/services/app-context.service';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { HeroArtworkResolverService } from '../../../../core/services/hero-artwork-resolver.service';
import {
  HistoryRivalsApi,
  HistoryRivalsEncountersApi,
  HistoryRivalsHero,
} from '../model/history-rivals-api.interface';
import {
  CURRENT_JOURNEY_ID,
  HistoryRivalsViewModel,
} from '../model/history-rivals-view-model.interface';

@Injectable({ providedIn: 'root' })
export class HistoryRivalsService extends BaseApiService {
  private readonly pageState: HistoryRivalsViewModel = {
    status: 'loading',
    error: null,
    errorCode: null,
    data: null,
    lang: 'en',
    selectedHeroId: null,
    selectedRivalId: null,
    selectedJourneyId: null,
    encounters: { status: 'empty', error: null, errorCode: null, data: null },
  };

  private encountersRequest: Subscription | null = null;

  constructor(
    api: ApiService,
    private readonly appContextService: AppContextService,
    private readonly artwork: HeroArtworkResolverService,
  ) {
    super(api);
  }

  getViewModel(): HistoryRivalsViewModel {
    return this.pageState;
  }

  selectedHero(): HistoryRivalsHero | null {
    return (
      this.pageState.data?.heroes.find((hero) => hero.id === this.pageState.selectedHeroId) ?? null
    );
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
        this.pageState.selectedHeroId =
          (data.heroes.find((hero) => hero.leader) ?? data.heroes[0])?.id ?? null;
        this.pageState.selectedRivalId = this.selectedHero()?.rivals[0]?.id ?? null;
        this.pageState.selectedJourneyId = data.currentJourney
          ? CURRENT_JOURNEY_ID
          : (data.completedJourneys[0]?.attemptId ?? null);
        this.loadEncounters();
      },
      error: (error: unknown) => {
        const apiError = toApiError(error);
        this.pageState.status = 'error';
        this.pageState.error = apiError.message;
        this.pageState.errorCode = apiError.messageCode;
      },
    });
  }

  selectHero(heroId: string): void {
    this.pageState.selectedHeroId = heroId;
    this.pageState.selectedRivalId = this.selectedHero()?.rivals[0]?.id ?? null;
    this.loadEncounters();
  }

  selectRival(rivalId: string): void {
    this.pageState.selectedRivalId = rivalId;
    this.loadEncounters();
  }

  selectJourney(journeyId: string): void {
    this.pageState.selectedJourneyId = journeyId;
    this.loadEncounters();
  }

  portraitPath(heroId: string): string {
    return this.artwork.portraitPath(heroId);
  }

  imageError(event: Event): void {
    this.artwork.useFallback(event);
  }

  private loadEncounters(): void {
    const { selectedHeroId, selectedRivalId, selectedJourneyId, encounters } = this.pageState;
    this.encountersRequest?.unsubscribe();
    encounters.data = null;
    encounters.error = null;
    encounters.errorCode = null;

    if (!selectedHeroId || !selectedRivalId || !selectedJourneyId) {
      encounters.status = 'empty';
      return;
    }

    encounters.status = 'loading';
    this.encountersRequest = this.getData<HistoryRivalsEncountersApi>(
      '/my-team/history-rivals/encounters',
      {
        heroId: selectedHeroId,
        rivalId: selectedRivalId,
        attemptId: selectedJourneyId === CURRENT_JOURNEY_ID ? undefined : selectedJourneyId,
      },
    ).subscribe({
      next: (data) => {
        encounters.data = data;
        encounters.status = data.encounters.length ? 'data' : 'empty';
      },
      error: (error: unknown) => {
        const apiError = toApiError(error);
        encounters.status = 'error';
        encounters.error = apiError.message;
        encounters.errorCode = apiError.messageCode;
      },
    });
  }
}
