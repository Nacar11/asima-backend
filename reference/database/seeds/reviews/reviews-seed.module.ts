import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewEntity } from '@/reviews/persistence/entities/review.entity';
import { ReviewsSeedService } from '@/database/seeds/reviews/reviews-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { ReviewMediaMappingEntity } from '@/media/persistence/entities/review-media-mapping.entity';
import { MediaEntity } from '@/media/persistence/entities/media.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReviewEntity,
      UserEntity,
      SellerEntity,
      ProductEntity,
      SalesOrderItemEntity,
      ProductVariantEntity,
      ServiceEntity,
      BookingEntity,
      ReviewMediaMappingEntity,
      MediaEntity,
    ]),
  ],
  providers: [ReviewsSeedService],
  exports: [ReviewsSeedService],
})
export class ReviewsSeedModule {}
