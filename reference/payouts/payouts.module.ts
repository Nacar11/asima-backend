import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayoutsService } from './payouts.service';
import { PAYOUT_PROVIDER_TOKEN } from './payout-provider.interface';
import { PayoutProviderEnum } from './enums/payout-provider.enum';
import { DragonPayPayoutProvider } from './providers/dragonpay-payout.provider';
import { ManualPayoutProvider } from './providers/manual-payout.provider';
import { MayaPayoutProvider } from './providers/maya-payout.provider';
import { CheckoutPaymentsModule } from '@/checkout-payments/checkout-payments.module';
import { BankAccountEntity } from '@/bank-accounts/persistence/entities/bank-account.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { EncryptionModule } from '@/utils/encryption/encryption.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([BankAccountEntity, UserEntity]),
    CheckoutPaymentsModule,
    EncryptionModule,
  ],
  providers: [
    DragonPayPayoutProvider,
    ManualPayoutProvider,
    MayaPayoutProvider,
    {
      provide: PAYOUT_PROVIDER_TOKEN,
      inject: [
        ConfigService,
        DragonPayPayoutProvider,
        MayaPayoutProvider,
        ManualPayoutProvider,
      ],
      useFactory: (
        config: ConfigService,
        dragonpay: DragonPayPayoutProvider,
        maya: MayaPayoutProvider,
        manual: ManualPayoutProvider,
      ) => {
        const provider =
          config.get<string>('PAYOUT_PROVIDER', { infer: true }) ??
          PayoutProviderEnum.MANUAL;
        switch (provider) {
          case PayoutProviderEnum.MAYA:
            return maya;
          case PayoutProviderEnum.DRAGONPAY:
            return dragonpay;
          default:
            return manual;
        }
      },
    },
    PayoutsService,
  ],
  exports: [PayoutsService],
})
export class PayoutsModule {}
