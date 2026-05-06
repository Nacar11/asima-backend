import { PartialType } from '@nestjs/swagger';
import { CreateMembershipBillingPeriodDto } from './create-membership-billing-period.dto';

/**
 * Update membership billing period DTO.
 */
export class UpdateMembershipBillingPeriodDto extends PartialType(
  CreateMembershipBillingPeriodDto,
) {}
