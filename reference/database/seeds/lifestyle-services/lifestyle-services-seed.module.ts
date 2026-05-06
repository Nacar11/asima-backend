import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LifestyleServicesSeedService } from '@/database/seeds/lifestyle-services/lifestyle-services-seed.service';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { VoucherServiceEntity } from '@/voucher-services/persistence/entities/voucher-service.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VoucherEntity,
      VoucherServiceEntity,
      ServiceEntity,
    ]),
  ],
  providers: [LifestyleServicesSeedService],
  exports: [LifestyleServicesSeedService],
})
export class LifestyleServicesSeedModule {}
