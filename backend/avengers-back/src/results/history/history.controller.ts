import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HistoryService } from './history.service';
import { AbstractController } from 'src/basic/abstract.controller';

@ApiTags('history')
@Controller('results/history')
export class HistoryController extends AbstractController {
  constructor(private readonly historyService: HistoryService) {
    super();
  }

  @Get()
  async getHistoryList(
    @Query("lang") lang: string = "es"
  ){
    return this.createOkResponse(await this.historyService.getHistoryList(lang));
  }

  @Get(':attemptId')
  async getHistoryDetail(
    @Param('attemptId') attemptId: string,
    @Query('lang') lang: string = 'es'
  ){
    return this.createOkResponse(await this.historyService.getHistoryDetail(attemptId, lang));
  }
}
