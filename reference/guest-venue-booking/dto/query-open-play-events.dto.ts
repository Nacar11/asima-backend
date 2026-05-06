import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class QueryOpenPlayEventsDto {
  @ApiPropertyOptional({ type: Number, example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({ type: Number, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  take?: number;

  @ApiPropertyOptional({ type: Number, example: 42 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  service_id?: number;

  @ApiPropertyOptional({ type: String, example: '2026-03-21' })
  @IsOptional()
  @IsDateString()
  event_date?: string;

  @ApiPropertyOptional({ type: String, example: 'Published' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: String, example: 'beginner' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  skill_level_code?: string;

  @ApiPropertyOptional({
    description:
      'Seller ID filter for system admins. Ignored for non-admin users.',
    example: 15,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : parseInt(value, 10),
  )
  @IsInt()
  @Min(1)
  seller_id?: number;
}
