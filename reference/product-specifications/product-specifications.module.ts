import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductSpecificationPersistenceModule } from './persistence/persistence.module';
import { ProductSpecificationsService } from './product-specifications.service';
import { ProductSpecificationsController } from './product-specifications.controller';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';

/**
 * Product specifications module
 */
@Module({
  imports: [
    ProductSpecificationPersistenceModule,
    TypeOrmModule.forFeature([ProductEntity, SellerEntity]),
  ],
  providers: [ProductSpecificationsService],
  controllers: [ProductSpecificationsController],
  exports: [ProductSpecificationsService],
})
export class ProductSpecificationsModule {}
