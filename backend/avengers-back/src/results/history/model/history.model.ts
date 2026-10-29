import { FinalJourneySummaryApi } from "src/basic/model/game-api/final-contract.model";
import { HistoryEventsApi, HistoryTeamsApi, JourneyHistoryStatisticsApi } from "src/basic/model/game-api/journey.model";

export interface HistoryModel {
        attemptId : string;
        summary: FinalJourneySummaryApi;
        teams: HistoryTeamsApi[];
        events: HistoryEventsApi[];
        statistics: JourneyHistoryStatisticsApi;
}