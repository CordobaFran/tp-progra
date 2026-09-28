import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HistoryRivalsService } from './history-rivals.service';

@ApiTags('history-rivals')
@Controller('my-team/history-rivals')
export class HistoryRivalsController {
  constructor(private readonly historyrivalsService: HistoryRivalsService) {}

  // TODO: Add the feature endpoints during the student implementation.
}
