import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { ProductSeedService } from '@/database/seeds/product/product-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity, UserEntity, SellerEntity]),
  ],
  providers: [ProductSeedService],
  exports: [ProductSeedService],
})
export class ProductSeedModule {}
