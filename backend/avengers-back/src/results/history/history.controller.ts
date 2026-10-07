import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HistoryService } from './history.service';

@ApiTags('history')
@Controller('results/history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async getHistoryList(
    @Query("lang") lang: string = "es"
  )
  {
    return this.historyService.getHistoryList(lang);
  }
}
