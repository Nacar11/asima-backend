import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum MembershipPlanBillingPeriodStatusFilter {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export class QueryMembershipPlanBillingPeriodDto {
  @ApiPropertyOptional({
    enum: MembershipPlanBillingPeriodStatusFilter,
    description: 'Filter by billing period status',
    example: MembershipPlanBillingPeriodStatusFilter.ACTIVE,
  })
  @IsOptional()
  @IsEnum(MembershipPlanBillingPeriodStatusFilter)
  status?: MembershipPlanBillingPeriodStatusFilter;
}
