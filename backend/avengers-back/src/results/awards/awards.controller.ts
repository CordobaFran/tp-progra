import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../../basic/abstract.controller';
import { ResponseObject } from '../../basic/response-object.interface';
import { AwardsModel } from './model/awards.model';
import { AwardsService } from './awards.service';

@ApiTags('Statistics and Awards')
@Controller('results/awards')
export class AwardsController extends AbstractController {
  constructor(private readonly awardsService: AwardsService) {
    super();
  }

  @Get()
  @ApiOperation({
    summary: 'Estadísticas y premios oficiales del torneo actual del Team configurado.',
  })
  async current(): Promise<ResponseObject<AwardsModel>> {
    return this.createOkResponse(await this.awardsService.statistics());
  }

  @Get(':attemptId')
  @ApiOperation({ summary: 'Estadísticas de un torneo completado del Team configurado.' })
  async byAttempt(@Param('attemptId') attemptId: string): Promise<ResponseObject<AwardsModel>> {
    return this.createOkResponse(await this.awardsService.statistics(attemptId));
  }
}
