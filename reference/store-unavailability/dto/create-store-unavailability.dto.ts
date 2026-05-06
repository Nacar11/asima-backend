import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

/**
 * Create Store Unavailability DTO.
 *
 * Simplified: No member-specific unavailability (seller is the provider).
 *
 * @version 2
 * @since 1.0.0
 */
export class CreateStoreUnavailabilityDto {
  @ApiProperty({ type: Number, example: 1, description: 'Seller ID' })
  @Type(() => Number)
  @IsInt()
  seller_id: number;

  @ApiPropertyOptional({
    type: Number,
    example: 101,
    description:
      'Optional service/venue scope. If omitted, unavailability applies to all services under the seller.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  service_id?: number | null;

  @ApiProperty({ type: String, format: 'date', example: '2025-12-24' })
  @IsDateString()
  unavailable_date: string;

  @ApiPropertyOptional({ type: String, format: 'date', example: '2025-12-26' })
  @IsOptional()
  @IsDateString()
  end_date?: string | null;

  @ApiPropertyOptional({ type: String, example: '09:00:00' })
  @IsOptional()
  @Matches(TIME_REGEX, {
    message: 'start_time must be in HH:mm or HH:mm:ss format',
  })
  start_time?: string | null;

  @ApiPropertyOptional({ type: String, example: '18:00:00' })
  @IsOptional()
  @Matches(TIME_REGEX, {
    message: 'end_time must be in HH:mm or HH:mm:ss format',
  })
  end_time?: string | null;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  is_full_day?: boolean;

  @ApiPropertyOptional({
    type: String,
    maxLength: 255,
    example: 'Holiday closure',
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  reason?: string | null;

  @ApiPropertyOptional({
    type: String,
    default: 'maintenance',
    example: 'maintenance',
    description: 'Block type: maintenance or open_play',
  })
  @IsOptional()
  @IsString()
  @IsIn(['maintenance', 'open_play'])
  @Length(1, 32)
  block_type?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 101,
    description: 'Linked open play event id when block_type=open_play',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  open_play_event_id?: number | null;

  @ApiPropertyOptional({ type: String, default: 'Active' })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  status?: string;
}
