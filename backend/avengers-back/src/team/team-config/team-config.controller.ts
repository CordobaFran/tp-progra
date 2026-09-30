import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TeamConfigService } from './team-config.service';

@ApiTags('team-config')
@Controller('my-team/configuration')
export class TeamConfigController {
  constructor(private readonly teamconfigService: TeamConfigService) {}

  // TODO: Add the feature endpoints during the student implementation.
}
