import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { VoucherCategoryEntity } from '@/voucher-categories/persistence/entities/voucher-category.entity';
import { VoucherProductEntity } from '@/voucher-products/persistence/entities/voucher-product.entity';
import { VoucherServiceEntity } from '@/voucher-services/persistence/entities/voucher-service.entity';
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { VoucherSeedService } from '@/database/seeds/voucher/voucher-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VoucherEntity,
      UserEntity,
      VoucherCategoryEntity,
      VoucherProductEntity,
      VoucherServiceEntity,
      CategoryEntity,
      ProductEntity,
      ServiceEntity,
    ]),
  ],
  providers: [VoucherSeedService],
  exports: [VoucherSeedService],
})
export class VoucherSeedModule {}
