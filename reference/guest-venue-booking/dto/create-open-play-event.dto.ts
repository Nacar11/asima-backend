import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const TIME_WITH_OPTIONAL_SECONDS_REGEX =
  /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

export class CreateOpenPlayEventDto {
  @ApiProperty({ type: Number, example: 42 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  service_id: number;

  @ApiProperty({ type: String, example: '2026-03-21' })
  @IsDateString()
  event_date: string;

  @ApiProperty({ type: String, example: '17:00:00' })
  @Matches(TIME_WITH_OPTIONAL_SECONDS_REGEX, {
    message: 'start_time must be in HH:mm or HH:mm:ss format',
  })
  start_time: string;

  @ApiProperty({ type: String, example: '19:00:00' })
  @Matches(TIME_WITH_OPTIONAL_SECONDS_REGEX, {
    message: 'end_time must be in HH:mm or HH:mm:ss format',
  })
  end_time: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Open Play Night',
    default: 'Open Play',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Beginner-friendly open play session.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ type: Number, example: 150 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rate_per_person: number;

  @ApiProperty({ type: Number, example: 16 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  max_applicants: number;

  @ApiPropertyOptional({
    type: String,
    example: 'all_levels',
    default: 'all_levels',
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  skill_level_code?: string;

  @ApiPropertyOptional({
    type: String,
    example: '2026-03-16T08:00:00.000Z',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  registration_start_at?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '2026-03-21T16:30:00.000Z',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  registration_end_at?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Published',
    default: 'Published',
  })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  status?: string;
}
