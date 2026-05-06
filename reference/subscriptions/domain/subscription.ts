import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Causer } from '@/utils/domain/causer';
import { SubscriptionStatusEnum } from '@/subscriptions/enums/subscription-status.enum';
import { SubscriptionPlan } from '@/subscription-plans/domain/subscription-plan';

export class SubscriptionUser {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: String, example: 'john.doe@cody.inc' })
  email: string | null;

  @ApiProperty({ type: String, example: 'John' })
  first_name: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  middle_name?: string | null;

  @ApiProperty({ type: String, example: 'Doe' })
  last_name: string | null;
}

export class Subscription {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: Number, example: 1 })
  user_id: number;

  @ApiPropertyOptional({ type: () => SubscriptionUser })
  user?: SubscriptionUser;

  @ApiProperty({ type: Number, example: 1 })
  plan_id: number;

  @ApiPropertyOptional({ type: () => SubscriptionPlan })
  plan?: SubscriptionPlan;

  @ApiProperty({ type: String, example: 'SUB-20251212-1234' })
  subscription_number: string;

  @ApiProperty({
    enum: SubscriptionStatusEnum,
    example: SubscriptionStatusEnum.ACTIVE,
  })
  status: SubscriptionStatusEnum;

  @ApiProperty({ type: Date, example: '2025-12-12' })
  start_date: Date;

  @ApiPropertyOptional({ type: Date, example: '2026-01-12', nullable: true })
  end_date?: Date | null;

  @ApiPropertyOptional({ type: Date, example: '2026-01-12', nullable: true })
  next_billing_date?: Date | null;

  @ApiProperty({ type: Boolean, example: true })
  auto_renew: boolean;

  @ApiPropertyOptional({ type: Date, nullable: true })
  cancelled_at?: Date | null;

  @ApiPropertyOptional({ type: () => Object, nullable: true })
  cancelled_by?: Causer | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  cancellation_reason?: string | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  grace_period_start?: Date | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  grace_period_end?: Date | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  grace_period_days?: number | null;

  @ApiPropertyOptional({ type: () => Object })
  created_by?: Causer | null;

  @ApiProperty()
  created_at: Date;

  @ApiPropertyOptional({ type: () => Object })
  updated_by?: Causer | null;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({ type: () => Object, nullable: true })
  deleted_by?: Causer | null;

  @ApiPropertyOptional({ nullable: true })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
