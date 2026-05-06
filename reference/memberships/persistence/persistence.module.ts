import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipEntity } from '@/memberships/persistence/entities/membership.entity';
import { MembershipPaymentEntity } from '@/memberships/persistence/entities/membership-payment.entity';
import { MembershipVoucherGrantEntity } from '@/memberships/persistence/entities/membership-voucher-grant.entity';
import { BaseMembershipRepository } from '@/memberships/persistence/base-membership.repository';
import { MembershipRepository } from '@/memberships/persistence/repositories/membership.repository';
import { BaseMembershipPaymentRepository } from '@/memberships/persistence/base-membership-payment.repository';
import { MembershipPaymentRepository } from '@/memberships/persistence/repositories/membership-payment.repository';
import { BaseMembershipVoucherGrantRepository } from '@/memberships/persistence/base-membership-voucher-grant.repository';
import { MembershipVoucherGrantRepository } from '@/memberships/persistence/repositories/membership-voucher-grant.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MembershipEntity,
      MembershipPaymentEntity,
      MembershipVoucherGrantEntity,
    ]),
  ],
  providers: [
    { provide: BaseMembershipRepository, useClass: MembershipRepository },
    {
      provide: BaseMembershipPaymentRepository,
      useClass: MembershipPaymentRepository,
    },
    {
      provide: BaseMembershipVoucherGrantRepository,
      useClass: MembershipVoucherGrantRepository,
    },
  ],
  exports: [
    BaseMembershipRepository,
    BaseMembershipPaymentRepository,
    BaseMembershipVoucherGrantRepository,
  ],
})
export class MembershipPersistenceModule {}
