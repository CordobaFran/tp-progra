// Public statistics contract supplied by the Game API. No award rules are calculated here.
export interface TeamStatisticsModel {
  teamId: string;
  encounters: number;
  wins: number;
  draws: number;
  losses: number;
  damageDealt: number;
  damageReceived: number;
  healing: number;
  kosCaused: number;
  kosSuffered: number;
  specialsUsed: number;
  teamActionsUsed: number;
  leaderAbilitiesUsed: number;
  rewardPointsEarned: number;
  rewardPointsSpent: number;
  powerUpsUsed: number;
  statGains: number;
}

export interface HeroStatisticsFactsModel {
  activeEncounters: number;
  activeRounds: number;
  winningActiveRounds: number;
  damageDealt: number;
  damageReceived: number;
  healing: number;
  kosCaused: number;
  kosSuffered: number;
  offensiveSpecialsUsed: number;
  supportSpecialsUsed: number;
  statGains: number;
}

export interface HeroStatisticsModel {
  teamId: string;
  heroId: string;
  eligible: boolean;
  totals: HeroStatisticsFactsModel;
  journey: HeroStatisticsFactsModel;
  finalStage: HeroStatisticsFactsModel;
}

export interface AwardEligibilityModel {
  minimumStageCode: string;
  eligibleTeamIds: string[];
}

export interface AwardWinnerModel {
  teamId: string;
  heroId: string;
}

export interface AwardWinningFactsModel {
  metricCode: string;
  value: number;
  kosSuffered?: number;
  activeEncounters?: number;
  koRate?: number;
  activeRounds?: number;
  damageReceived?: number;
  kosCaused?: number;
  damageDealt?: number;
  healing?: number;
  winningActiveRounds?: number;
}

export interface CompetitionSummaryModel {
  journeyEncounters: number;
  finalStagePlayed: boolean;
  finalStageNormalTurnsPlayed: number;
}

export interface OfficialAwardDecisionModel {
  code: string;
  label: string;
  explanation: string;
  winner: AwardWinnerModel | null;
  winningFacts: AwardWinningFactsModel | null;
  reason: string;
}

export interface CompetitionStatisticsDataModel {
  attemptId: string;
  language: string;
  status: 'COMPLETED';
  completionOutcome: string;
  endingCode: string;
  terminalReasonCode: string | null;
  completedAt: string;
  eligibility: AwardEligibilityModel;
  competition: CompetitionSummaryModel;
  teamStatistics: TeamStatisticsModel[];
  heroStatistics: HeroStatisticsModel[];
  awards: OfficialAwardDecisionModel[];
}

export interface AwardsModel extends CompetitionStatisticsDataModel {
  configuredTeamId: string;
  heroNames: Record<string, string>;
  teamNames: Record<string, string>;
}
