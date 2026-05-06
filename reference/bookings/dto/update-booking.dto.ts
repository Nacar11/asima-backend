import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  Matches,
  MaxLength,
  IsInt,
  IsPositive,
  IsNumber,
} from 'class-validator';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';

/**
 * DTO for updating a booking.
 *
 * Used for updating booking details, status, scheduling, and notes.
 * All fields are optional - only provided fields will be updated.
 *
 * @version 1
 * @since 1.0.0
 */
export class UpdateBookingDto {
  @ApiPropertyOptional({
    enum: BookingStatusEnum,
    description: 'Booking status',
    example: BookingStatusEnum.CONFIRMED,
  })
  @IsOptional()
  @IsEnum(BookingStatusEnum)
  status?: BookingStatusEnum;

  @ApiPropertyOptional({
    description: 'Scheduled date for the service (YYYY-MM-DD)',
    example: '2024-12-25',
  })
  @IsOptional()
  @IsDateString()
  scheduled_date?: string;

  @ApiPropertyOptional({
    description: 'Scheduled start time (HH:mm:ss)',
    example: '09:00:00',
  })
  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'scheduled_start_time must be in HH:mm:ss format',
  })
  scheduled_start_time?: string;

  @ApiPropertyOptional({
    description: 'Scheduled end time (HH:mm:ss)',
    example: '11:00:00',
  })
  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'scheduled_end_time must be in HH:mm:ss format',
  })
  scheduled_end_time?: string;

  @ApiPropertyOptional({
    description: 'Assigned member ID',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  assigned_member_id?: number;

  @ApiPropertyOptional({
    description: 'Service address ID',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  service_address_id?: number;

  @ApiPropertyOptional({
    description: 'Service address as text',
    example: '123 Main St, City, Province',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  service_address_text?: string;

  @ApiPropertyOptional({
    description: 'Service location latitude',
    example: 14.5995,
  })
  @IsOptional()
  @IsNumber()
  service_latitude?: number;

  @ApiPropertyOptional({
    description: 'Service location longitude',
    example: 120.9842,
  })
  @IsOptional()
  @IsNumber()
  service_longitude?: number;

  @ApiPropertyOptional({
    description: 'Customer notes',
    example: 'Please arrive before 9 AM',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customer_notes?: string;

  @ApiPropertyOptional({
    description: 'Provider notes (internal)',
    example: 'Customer requested early arrival',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  provider_notes?: string;

  @ApiPropertyOptional({
    description: 'Internal notes (admin only)',
    example: 'VIP customer - expedite',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internal_notes?: string;

  @ApiPropertyOptional({
    description: 'Cancellation reason (required if cancelling)',
    example: 'Customer requested cancellation',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancellation_reason?: string;
}
