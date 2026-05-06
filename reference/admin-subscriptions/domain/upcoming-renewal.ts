import { ApiProperty } from '@nestjs/swagger';

/**
 * UpcomingRenewal domain model.
 *
 * Represents an upcoming subscription renewal for the admin dashboard.
 *
 * @version 1
 * @since 1.0.0
 */
export class UpcomingRenewal {
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

  @ApiProperty({ type: Number, example: 1 })
  plan_id: number;

  @ApiProperty({ type: String, example: 'Pro Plan' })
  plan_name: string;

  @ApiProperty({ type: Number, example: 499.0 })
  amount: number;

  @ApiProperty({ type: String, example: 'monthly' })
  billing_cycle: string;

  @ApiProperty({ type: Date, example: '2025-12-29' })
  due_date: Date;

  @ApiProperty({ type: Number, example: 3 })
  days_until_renewal: number;

  @ApiProperty({ type: Boolean, example: true })
  auto_renew: boolean;
}
