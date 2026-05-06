import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipPersistenceModule } from '@/memberships/persistence/persistence.module';
import { MembershipsService } from '@/memberships/memberships.service';
import { MembershipsController } from '@/memberships/memberships.controller';
import { AdminMembershipsController } from '@/memberships/controllers/admin-memberships.controller';
import { MembershipVoucherGrantsController } from '@/memberships/controllers/membership-voucher-grants.controller';
import { ParametersModule } from '@/parameters/parameters.module';
import { MembershipVoucherConfigurationPersistenceModule } from '@/membership-voucher-configurations/persistence/persistence.module';
import { UserVoucherEntity } from '@/vouchers/persistence/entities/user-voucher.entity';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { VoucherCategoryEntity } from '@/voucher-categories/persistence/entities/voucher-category.entity';
import { VoucherProductEntity } from '@/voucher-products/persistence/entities/voucher-product.entity';
import { MembershipPlanEntity } from '@/memberships/persistence/entities/membership-plan.entity';
import { MembershipBillingPeriodEntity } from '@/memberships/persistence/entities/membership-billing-period.entity';
import { MembershipPlanBillingPeriodEntity } from '@/memberships/persistence/entities/membership-plan-billing-period.entity';
import { MembershipEntity } from '@/memberships/persistence/entities/membership.entity';
import { MembershipsSchedulerService } from '@/memberships/memberships-scheduler.service';
import { UserAssignmentsModule } from '@/user-assignments/user-assignments.module';
import { UserGroupsModule } from '@/user-groups/user-groups.module';
import { StorageModule } from '@/storage/storage.module';
import { CheckoutPaymentsModule } from '@/checkout-payments/checkout-payments.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { MailModule } from '@/mail/mail.module';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserVoucherEntity,
      VoucherEntity,
      VoucherCategoryEntity,
      VoucherProductEntity,
      MembershipPlanEntity,
      MembershipBillingPeriodEntity,
      MembershipPlanBillingPeriodEntity,
      MembershipEntity,
      UserEntity,
    ]),
    MembershipPersistenceModule,
    MembershipVoucherConfigurationPersistenceModule,
    ParametersModule,
    forwardRef(() => CheckoutPaymentsModule),
    UserAssignmentsModule,
    UserGroupsModule,
    StorageModule.register(),
    NotificationsModule,
    MailModule,
  ],
  controllers: [
    MembershipsController,
    AdminMembershipsController,
    MembershipVoucherGrantsController,
  ],
  providers: [MembershipsService, MembershipsSchedulerService],
  exports: [MembershipsService],
})
export class MembershipsModule {}
