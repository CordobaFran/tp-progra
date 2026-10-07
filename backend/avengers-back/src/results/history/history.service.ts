import { Injectable } from '@nestjs/common';
import { GameApiService } from 'src/basic/game-api.service';
import { GameFeatureApiService } from 'src/basic/game-feature-api.service';
import { ApplicationContextService } from 'src/basic/services/application-context.service';

@Injectable()
export class HistoryService {

  constructor(
    private readonly game : GameApiService,
    private readonly appContext : ApplicationContextService
  ) {}

  async getHistoryList(lang: string){
    const teamId = this.appContext.getCurrentTeamId();
    const url = `/teams/${teamId}/history`;
    const response = await this.game.get<any>(url, { lang })
    return response;
  }
}
