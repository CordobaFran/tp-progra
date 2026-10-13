import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeroArtworkResolverService } from '../../../core/services/hero-artwork-resolver.service';
import { HeroStatisticsFactsModel, HeroStatisticsModel } from './model/awards.model';
import { AwardsService } from './service/awards.service';

@Component({
  selector: 'app-awards',
  templateUrl: './awards.component.html',
  styleUrls: ['./awards.component.css'],
  standalone: false,
  providers: [AwardsService],
})
export class AwardsComponent implements OnInit, OnDestroy {
  private routeSubscription?: Subscription;

  attemptId?: string;

  teamFilter = '';

  phase: 'totals' | 'journey' | 'finalStage' = 'totals';

  metric: keyof HeroStatisticsFactsModel = 'damageDealt';

  readonly metrics: { key: keyof HeroStatisticsFactsModel; label: string }[] = [
    { key: 'activeEncounters', label: 'Encuentros activos' },
    { key: 'activeRounds', label: 'Rondas activas' },
    { key: 'winningActiveRounds', label: 'Rondas ganadas' },
    { key: 'damageDealt', label: 'Daño causado' },
    { key: 'damageReceived', label: 'Daño recibido' },
    { key: 'healing', label: 'Curación' },
    { key: 'kosCaused', label: 'KO causados' },
    { key: 'kosSuffered', label: 'KO sufridos' },
    { key: 'offensiveSpecialsUsed', label: 'Especiales ofensivos' },
    { key: 'supportSpecialsUsed', label: 'Especiales de apoyo' },
    { key: 'statGains', label: 'Mejoras de atributos' },
  ];

  constructor(
    private readonly awards: AwardsService,
    private readonly route: ActivatedRoute,
    private readonly artwork: HeroArtworkResolverService,
  ) {}

  get pageState() {
    return this.awards.getViewModel();
  }

  get heroes(): HeroStatisticsModel[] {
    return (this.pageState.data?.heroStatistics ?? [])
      .filter((hero) => !this.teamFilter || hero.teamId === this.teamFilter)
      .slice()
      .sort(
        (a, b) =>
          b[this.phase][this.metric] - a[this.phase][this.metric] ||
          a.heroId.localeCompare(b.heroId) ||
          a.teamId.localeCompare(b.teamId),
      );
  }

  get teams() {
    return (this.pageState.data?.teamStatistics ?? []).filter(
      (team) => !this.teamFilter || team.teamId === this.teamFilter,
    );
  }

  ngOnInit(): void {
    this.routeSubscription = this.route.queryParamMap.subscribe((params) => {
      this.attemptId = params.get('attemptId')?.trim() || undefined;
      this.refresh();
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.awards.dispose();
  }

  refresh(): void {
    this.awards.initialize(this.attemptId);
  }

  heroName(id: string): string {
    return this.pageState.data?.heroNames[id] ?? id;
  }

  teamName(id: string): string {
    return this.pageState.data?.teamNames[id] ?? id;
  }

  portrait(id: string): string {
    return this.artwork.portraitPath(id);
  }

  imageError(event: Event): void {
    this.artwork.useFallback(event);
  }

  outcome(code: string): string {
    return (
      ({ VICTORY: 'Victoria', DEFEAT: 'Derrota', ABANDON: 'Abandono' } as Record<string, string>)[
        code
      ] ?? code
    );
  }
}
