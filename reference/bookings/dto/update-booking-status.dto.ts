import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';

/**
 * DTO for updating booking status.
 *
 * Used for status transitions with optional notes.
 *
 * @version 1
 * @since 1.0.0
 */
export class UpdateBookingStatusDto {
  @ApiProperty({
    enum: BookingStatusEnum,
    description: 'New booking status',
    example: BookingStatusEnum.CONFIRMED,
  })
  @IsNotEmpty()
  @IsEnum(BookingStatusEnum)
  status: BookingStatusEnum;

  @ApiPropertyOptional({
    description: 'Optional notes for the status change',
    example: 'Booking confirmed by seller',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
