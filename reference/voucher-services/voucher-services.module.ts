import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherServiceEntity } from '@/voucher-services/persistence/entities/voucher-service.entity';

/**
 * Voucher services module.
 */
@Module({
  imports: [TypeOrmModule.forFeature([VoucherServiceEntity])],
  exports: [TypeOrmModule],
})
export class VoucherServicesModule {}
