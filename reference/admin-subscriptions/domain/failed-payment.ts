import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * FailedPayment domain model.
 *
 * Represents a failed subscription payment for the admin dashboard.
 *
 * @version 1
 * @since 1.0.0
 */
export class FailedPayment {
  @ApiProperty({ type: Number, example: 1 })
  payment_id: number;

  @ApiProperty({ type: String, example: 'SUBPAY-20251226-1234' })
  payment_number: string;

  @ApiProperty({ type: Number, example: 1 })
  subscription_id: number;

  @ApiProperty({ type: String, example: 'SUB-20251226-1234' })
  subscription_number: string;

  @ApiProperty({ type: Number, example: 1 })
  customer_id: number;

  @ApiProperty({ type: String, example: 'John Doe' })
  customer_name: string;

  @ApiProperty({ type: String, example: 'john@example.com' })
  customer_email: string;

  @ApiProperty({ type: Number, example: 499.0 })
  amount: number;

  @ApiProperty({ type: String, example: 'Card Declined' })
  failure_reason: string;

  @ApiProperty({ type: Number, example: 2 })
  retry_count: number;

  @ApiPropertyOptional({ type: Date, nullable: true })
  next_retry_at?: Date | null;

  @ApiProperty({ type: Date })
  failed_at: Date;

  @ApiProperty({ type: Boolean, example: true })
  can_retry: boolean;
}
