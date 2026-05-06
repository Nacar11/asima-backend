import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Length,
  Min,
} from 'class-validator';

export class QueryPublicOpenPlayEventsListDto {
  @ApiPropertyOptional({
    type: String,
    format: 'date',
    example: '2026-03-27',
    description: 'Start date (YYYY-MM-DD). Defaults to current local date.',
  })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    example: '2026-04-26',
    description:
      'End date (YYYY-MM-DD). Defaults to date_from + 30 days when omitted.',
  })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'tambayan-district',
    description: 'Optional public location filter.',
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
    example: 'advanced',
    description: 'Optional skill level filter.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  skill_level_code?: string;

  @ApiPropertyOptional({ type: Number, example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({ type: Number, example: 20, default: 20, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  take?: number;
}
