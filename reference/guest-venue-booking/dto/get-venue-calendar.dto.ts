import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class GetVenueCalendarDto {
  @ApiPropertyOptional({
    type: String,
    example: 'tambayan-district',
    description: 'Filter public venue calendar to a named pickleball location.',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    example: '2026-03-13',
    description:
      'Specific date (YYYY-MM-DD). Use this for one-day calendar query.',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    example: '2026-03-01',
    description: 'Range start date (YYYY-MM-DD). Requires end_date.',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    example: '2026-03-31',
    description: 'Range end date (YYYY-MM-DD). Requires start_date.',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 12,
    description: 'Filter by specific venue service id',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  service_id?: number;
}
