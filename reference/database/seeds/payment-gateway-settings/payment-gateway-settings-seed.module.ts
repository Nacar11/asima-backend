import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '@/storage/storage.module';
import { PaymentGatewaySettingsSeedService } from '@/database/seeds/payment-gateway-settings/payment-gateway-settings-seed.service';
import { CustomPaymentMethodEntity } from '@/checkout-payments/persistence/entities/custom-payment-method.entity';

@Module({
  imports: [
    StorageModule.register(),
    TypeOrmModule.forFeature([CustomPaymentMethodEntity]),
  ],
  providers: [PaymentGatewaySettingsSeedService],
  exports: [PaymentGatewaySettingsSeedService],
})
export class PaymentGatewaySettingsSeedModule {}
