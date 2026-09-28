import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { KnockoutStageService } from './knockout-stage.service';

@ApiTags('knockout-stage')
@Controller('journey/knockout-stage')
export class KnockoutStageController {
  constructor(private readonly knockoutstageService: KnockoutStageService) {}

  // TODO: Add the feature endpoints during the student implementation.
}
