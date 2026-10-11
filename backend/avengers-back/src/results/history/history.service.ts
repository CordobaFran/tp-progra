import { Injectable } from '@nestjs/common';
import { GameApiService } from 'src/basic/game-api.service';
//import { GameFeatureApiService } from 'src/basic/game-feature-api.service';
import { ApplicationContextService } from 'src/basic/services/application-context.service';

@Injectable()
export class HistoryService {
  private readonly teamId = this.appContext.getCurrentTeamId();
  
  constructor(
    private readonly game : GameApiService,
    private readonly appContext : ApplicationContextService
  ) {}

  async getHistoryList(lang: string){
    const url = `/teams/${this.teamId}/history`;
    const response = await this.game.get<any>(url, { lang })
    return response;
  }

  async getHistoryDetail(attemptId: string, lang:string){
    const [summary, teams, events, statistics] = await Promise.all(
      [
        this.game.get<any>(`/teams/${this.teamId}/journeys/${attemptId}`, {lang}), 
        this.game.get<any>(`/teams/${this.teamId}/journeys/${attemptId}/teams`),
        this.game.get<any>(`/teams/${this.teamId}/journeys/${attemptId}/events`, {lang}),
        this.game.get<any>(`/teams/${this.teamId}/journeys/${attemptId}/statistics`, {lang})
      ]
    )
    return {
      attemptId,
      summary,
      teams,
      events,
      statistics
    }
  }
}
