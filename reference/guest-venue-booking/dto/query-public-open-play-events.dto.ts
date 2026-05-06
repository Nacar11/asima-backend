import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class QueryPublicOpenPlayEventsDto {
  @ApiProperty({
    type: String,
    format: 'date',
    example: '2026-03-26',
    description: 'Target date (YYYY-MM-DD).',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    type: String,
    example: 'tambayan-district',
    description:
      'Optional location filter for public pickleball venues on the landing page.',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 12,
    description: 'Optional venue service id filter.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  service_id?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'intermediate',
    description: 'Optional skill level filter.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  skill_level_code?: string;
}
