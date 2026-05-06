import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { PaymentRefundMethodEnum } from '../domain/payment-refund-method.enum';

/**
 * DTO for processing a refund disbursement.
 *
 * refund_method determines the flow:
 *   - 'maya': calls Maya Refund API; requires MAYA_SECRET_KEY; no proc fields needed
 *   - 'cash': no proc fields needed, marks as completed immediately
 *   - 'wallet': (future) credits customer wallet, marks as completed
 */
export class ProcessPayoutDto {
  @ApiProperty({
    description: 'Disbursement method',
    enum: PaymentRefundMethodEnum,
    example: 'cash',
  })
  @IsEnum(PaymentRefundMethodEnum)
  refund_method: PaymentRefundMethodEnum;

  @ApiPropertyOptional({
    description:
      'Override payout amount. Defaults to the approved refund amount if omitted.',
    example: 485,
  })
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Notes about the payout',
    example: 'Refund via GCash',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
