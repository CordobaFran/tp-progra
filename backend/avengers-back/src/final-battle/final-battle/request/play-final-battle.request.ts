import { BadRequestException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { FinalStageCommandApi } from '../../shared/model/final-stage-api.model';

export class PlayFinalBattleRequest {
  @ApiProperty({ enum: ['START', 'CHOOSE_ACTION', 'ABANDON'] })
  @IsIn(['START', 'CHOOSE_ACTION', 'ABANDON'])
  type!: 'START' | 'CHOOSE_ACTION' | 'ABANDON';

  @ApiPropertyOptional({ description: 'Exact opaque actionId; required only for CHOOSE_ACTION.' })
  @ValidateIf(
    (request: PlayFinalBattleRequest) =>
      request.type === 'CHOOSE_ACTION' || request.actionId !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  actionId?: string;

  toCommand(): FinalStageCommandApi {
    if (this.type === 'CHOOSE_ACTION') {
      if (typeof this.actionId !== 'string' || !this.actionId.length) {
        throw new BadRequestException('CHOOSE_ACTION requires actionId.');
      }
      return { type: this.type, actionId: this.actionId };
    }
    if (this.actionId !== undefined) {
      throw new BadRequestException('Only CHOOSE_ACTION accepts actionId.');
    }
    if (this.type !== 'START' && this.type !== 'ABANDON') {
      throw new BadRequestException('Unknown Final Stage command.');
    }
    return { type: this.type };
  }
}
