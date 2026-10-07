import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../../basic/abstract.controller';
import { ResponseObject } from '../../basic/response-object.interface';
import { HistoryRivalsModel } from './model/history-rivals.model';
import { HistoryRivalsService } from './history-rivals.service';

@ApiTags('History Rivals')
@Controller('my-team/history-rivals')
export class HistoryRivalsController extends AbstractController {
  constructor(private readonly historyRivalsService: HistoryRivalsService) {
    super();
  }

  @Get()
  @ApiOperation({
    summary: 'Read the Team Heroes with their canonical Rivals and the available Journeys.',
  })
  async getHistoryRivals(): Promise<ResponseObject<HistoryRivalsModel>> {
    return this.createOkResponse(await this.historyRivalsService.getHistoryRivals());
  }
}
