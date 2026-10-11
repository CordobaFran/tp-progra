import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { KnockoutStageService } from './knockout-stage.service';
import { KnockoutStageModel } from './model/knockout-stage.model';
import { ResponseObject } from '../../basic/response-object.interface';
import { AbstractController } from '../../basic/abstract.controller';

@ApiTags('knockout-stage')
@Controller('journey/knockout-stage')
export class KnockoutStageController extends AbstractController {
  constructor(private readonly knockoutStageService: KnockoutStageService) {
    super();
  }

  @Get()
  @ApiOperation({
    summary: 'Get knockout teams, stage brackets and encounters for current journey.',
  })
  async getKnockoutStage(): Promise<ResponseObject<KnockoutStageModel>> {
    return this.createOkResponse(await this.knockoutStageService.getKnockoutStage());
  }
}
