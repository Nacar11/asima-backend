import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CancellationRoleEnum } from '@/booking-cancellations/enums/cancellation-role.enum';
import { CancellationReasonEnum } from '@/booking-cancellations/enums/cancellation-reason.enum';
import { CancellationPolicyEnum } from '@/booking-cancellations/enums/cancellation-policy.enum';

/**
 * DTO for querying booking cancellations.
 *
 * @version 1
 * @since 1.0.0
 */
export class QueryBookingCancellationDto {
  @ApiPropertyOptional({ type: Number, example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  skip?: number;

  @ApiPropertyOptional({ type: Number, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  take?: number;

  @ApiPropertyOptional({ type: Number, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  booking_id?: number;

  @ApiPropertyOptional({ type: Number, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cancelled_by?: number;

  @ApiPropertyOptional({ enum: CancellationRoleEnum })
  @IsOptional()
  @IsEnum(CancellationRoleEnum)
  cancelled_by_role?: CancellationRoleEnum;

  @ApiPropertyOptional({ enum: CancellationReasonEnum })
  @IsOptional()
  @IsEnum(CancellationReasonEnum)
  reason?: CancellationReasonEnum;

  @ApiPropertyOptional({ enum: CancellationPolicyEnum })
  @IsOptional()
  @IsEnum(CancellationPolicyEnum)
  policy_applied?: CancellationPolicyEnum;
}
