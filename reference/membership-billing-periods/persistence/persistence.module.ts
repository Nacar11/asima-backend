import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipBillingPeriodEntity } from '@/memberships/persistence/entities/membership-billing-period.entity';
import { MembershipPlanBillingPeriodEntity } from '@/memberships/persistence/entities/membership-plan-billing-period.entity';
import { MembershipBillingPeriodMapper } from './mappers/membership-billing-period.mapper';
import { BaseMembershipBillingPeriodRepository } from './base-membership-billing-period.repository';
import { MembershipBillingPeriodRepository } from './repositories/membership-billing-period.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MembershipBillingPeriodEntity,
      MembershipPlanBillingPeriodEntity,
    ]),
  ],
  providers: [
    MembershipBillingPeriodMapper,
    {
      provide: BaseMembershipBillingPeriodRepository,
      useClass: MembershipBillingPeriodRepository,
    },
  ],
  exports: [
    TypeOrmModule,
    MembershipBillingPeriodMapper,
    BaseMembershipBillingPeriodRepository,
  ],
})
export class MembershipBillingPeriodPersistenceModule {}
