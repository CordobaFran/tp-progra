import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LiveEventsService } from './live-events.service';
import { AbstractController } from '../../basic/abstract.controller';
import { ResponseObject } from '../../basic/response-object.interface';
import { LiveEventsStateModel } from './model/live-events.model';

@ApiTags('live-events')
@Controller('final-stage/events')
export class LiveEventsController extends AbstractController {
  constructor(private readonly liveeventsService: LiveEventsService) {
    super();
  }

  @Get()
  @ApiOperation({
    summary: 'Get the current final stage events and state.',
  })
  async getLiveEvents(): Promise<ResponseObject<LiveEventsStateModel>> {
    return this.createOkResponse(await this.liveeventsService.getLiveEvents());
  }
}
