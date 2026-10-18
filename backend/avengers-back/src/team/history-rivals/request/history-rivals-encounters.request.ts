import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class HistoryRivalsEncountersRequest {
  @ApiProperty({ example: 'hulk', maxLength: 60, description: 'Selected Hero of the Player Team.' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  heroId!: string;

  @ApiProperty({ example: 'wolverine', maxLength: 60, description: 'Canonical Rival of the Hero.' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  rivalId!: string;

  @ApiPropertyOptional({
    maxLength: 60,
    description: 'Completed Journey attemptId. Omit it to use the current Journey.',
  })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  attemptId?: string;
}
