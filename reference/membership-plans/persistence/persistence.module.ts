import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipPlanEntity } from './entities/membership-plan.entity';
import { MembershipPlanBillingPeriodEntity } from '@/memberships/persistence/entities/membership-plan-billing-period.entity';
import { MembershipPlanMapper } from './mappers/membership-plan.mapper';
import { BaseMembershipPlanRepository } from './base-membership-plan.repository';
import { MembershipPlanRepository } from './repositories/membership-plan.repository';

/**
 * Persistence module for membership plans.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      MembershipPlanEntity,
      MembershipPlanBillingPeriodEntity,
    ]),
  ],
  providers: [
    MembershipPlanMapper,
    {
      provide: BaseMembershipPlanRepository,
      useClass: MembershipPlanRepository,
    },
  ],
  exports: [TypeOrmModule, MembershipPlanMapper, BaseMembershipPlanRepository],
})
export class MembershipPlanPersistenceModule {}
