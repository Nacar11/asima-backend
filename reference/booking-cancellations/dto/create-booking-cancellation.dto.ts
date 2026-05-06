import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEnum,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { CancellationReasonEnum } from '@/booking-cancellations/enums/cancellation-reason.enum';

/**
 * DTO for creating a booking cancellation.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateBookingCancellationDto {
  @ApiProperty({
    enum: CancellationReasonEnum,
    example: CancellationReasonEnum.SCHEDULE_CONFLICT,
    description: 'Reason for cancellation',
  })
  @IsNotEmpty()
  @IsEnum(CancellationReasonEnum)
  reason: CancellationReasonEnum;

  @ApiPropertyOptional({
    type: String,
    example: 'Need to reschedule due to emergency',
    description: 'Additional details about the cancellation',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason_details?: string;
}
