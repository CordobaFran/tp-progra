import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TeamStatusService } from './team-status.service';

@ApiTags('team-status')
@Controller('final-stage/status')
export class TeamStatusController {
  constructor(private readonly teamstatusService: TeamStatusService) {}

  // TODO: Add the feature endpoints during the student implementation.
}
