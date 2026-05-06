import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateOpenPlayEventDto {
  @ApiPropertyOptional({
    type: String,
    example: 'Open Play Night',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 150,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rate_per_person?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 16,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  max_applicants?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'all_levels',
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  skill_level_code?: string;
}
