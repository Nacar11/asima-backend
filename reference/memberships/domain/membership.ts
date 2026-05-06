import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Causer } from '@/utils/domain/causer';
import { MembershipStatusEnum } from '@/memberships/enums/membership-status.enum';
import { MembershipPlan } from './membership-plan';

export class Membership {
  @ApiProperty({ type: Number, example: 1 })
  id: number;
  @ApiProperty({ type: Number, example: 15 })
  user_id: number;
  @ApiProperty({ type: Number, example: 1 })
  membership_plan_id: number;
  @ApiPropertyOptional({ type: () => MembershipPlan, nullable: true })
  membership_plan?: MembershipPlan | null;
  @ApiProperty({ type: Number, example: 1 })
  membership_plan_billing_period_id: number;
  @ApiProperty({
    enum: MembershipStatusEnum,
    example: MembershipStatusEnum.ACTIVE,
  })
  status: MembershipStatusEnum;
  @ApiPropertyOptional({
    type: Date,
    nullable: true,
    example: '2026-02-25T00:00:00.000Z',
  })
  starts_at: Date | null;
  @ApiPropertyOptional({
    type: Date,
    nullable: true,
    example: '2026-03-27T00:00:00.000Z',
  })
  ends_at: Date | null;
  @ApiPropertyOptional({
    type: Date,
    nullable: true,
    example: '2026-04-03T00:00:00.000Z',
  })
  grace_ends_at?: Date | null;
  @ApiProperty({ type: Boolean, example: true })
  is_auto_renew_enabled: boolean;
  @ApiPropertyOptional({ type: Date, nullable: true })
  cancelled_at?: Date | null;
  @ApiPropertyOptional({ type: () => Object, nullable: true })
  created_by?: Causer | null;
  @ApiProperty()
  created_at: Date;
  @ApiPropertyOptional({ type: () => Object, nullable: true })
  updated_by?: Causer | null;
  @ApiProperty()
  updated_at: Date;
  @ApiPropertyOptional({ type: () => Object, nullable: true })
  deleted_by?: Causer | null;
  @ApiPropertyOptional({ type: Date, nullable: true })
  deleted_at?: Date | null;
  @Exclude()
  __entity?: string;
}
