import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../../basic/abstract.controller';
import { ResponseObject } from '../../basic/response-object.interface';
import { FinalBattleService } from './final-battle.service';
import { FinalBattleModel } from './model/final-battle.model';
import { PlayFinalBattleRequest } from './request/play-final-battle.request';

@ApiTags('final-battle')
@Controller('final-stage')
export class FinalBattleController extends AbstractController {
  constructor(private readonly finalBattle: FinalBattleService) {
    super();
  }

  @Get()
  @ApiOperation({ summary: 'Read the composed current Final Battle.' })
  async getBattle(): Promise<ResponseObject<FinalBattleModel>> {
    return this.createOkResponse(await this.finalBattle.getBattle());
  }

  @Post('play')
  @HttpCode(200)
  @ApiOperation({ summary: 'Execute a public command and reload the current Final Battle.' })
  async play(@Body() request: PlayFinalBattleRequest): Promise<ResponseObject<FinalBattleModel>> {
    return this.createOkResponse(await this.finalBattle.play(request.toCommand()));
  }
}

