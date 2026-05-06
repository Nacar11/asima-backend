import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

const TIME_WITH_OPTIONAL_SECONDS_REGEX =
  /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

export const OPEN_PLAY_RECURRENCE_TYPES = [
  'daily',
  'weekly',
  'monthly',
] as const;
export type OpenPlayRecurrenceType =
  (typeof OPEN_PLAY_RECURRENCE_TYPES)[number];

export class CreateRecurringOpenPlayEventsDto {
  @ApiProperty({ type: Number, example: 42 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  service_id: number;

  @ApiProperty({ type: String, example: '2026-04-01' })
  @IsDateString()
  range_start_date: string;

  @ApiProperty({ type: String, example: '2026-04-30' })
  @IsDateString()
  range_end_date: string;

  @ApiProperty({
    enum: OPEN_PLAY_RECURRENCE_TYPES,
    example: 'weekly',
    description: 'Recurrence mode: daily, weekly, or monthly',
  })
  @IsString()
  @IsIn(OPEN_PLAY_RECURRENCE_TYPES)
  recurrence_type: OpenPlayRecurrenceType;

  @ApiPropertyOptional({
    type: [Number],
    example: [1, 3, 5],
    description:
      'Weekday filter for weekly recurrence. Uses JavaScript weekday indexing: 0=Sun ... 6=Sat.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekly_days?: number[];

  @ApiPropertyOptional({
    type: Number,
    example: 15,
    description:
      'Day of month (1-31) for monthly recurrence. Defaults to range_start_date day if omitted.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  monthly_day?: number | null;

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
