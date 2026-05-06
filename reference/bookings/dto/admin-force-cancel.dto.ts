import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { CancellationReasonEnum } from '@/booking-cancellations/enums/cancellation-reason.enum';

/**
 * DTO for admin force cancel action.
 *
 * @version 1
 * @since 1.0.0
 */
export class AdminForceCancelDto {
  @ApiProperty({
    enum: CancellationReasonEnum,
    example: CancellationReasonEnum.OTHER,
    description: 'Cancellation reason',
  })
  @IsNotEmpty()
  reason: CancellationReasonEnum;

  @ApiProperty({
    type: String,
    example: 'Admin cancellation due to policy violation',
    description: 'Cancellation reason details',
    maxLength: 1000,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  reason_details: string;

  @ApiPropertyOptional({
    type: Number,
    example: 100,
    description:
      'Refund percentage (0-100). Defaults to policy-based calculation if not provided.',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  refund_percent?: number;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Whether to notify customer and provider',
    default: true,
  })
  @IsOptional()
  notify_parties?: boolean;
}
