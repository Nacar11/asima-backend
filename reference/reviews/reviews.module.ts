import { Module } from '@nestjs/common';
import { ReviewsService } from '@/reviews/reviews.service';
import { ReviewsController } from '@/reviews/reviews.controller';
import { ReviewPersistenceModule } from '@/reviews/persistence/persistence.module';
import { MediaModule } from '@/media/media.module';
import { SalesOrderPersistenceModule } from '@/sales-orders/persistence/persistence.module';
import { ProductsModule } from '@/products/products.module';
import { FeaturedProductsModule } from '@/featured-products/featured-products.module';
import { BookingsModule } from '@/bookings/bookings.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ReviewPersistenceModule,
    MediaModule,
    SalesOrderPersistenceModule,
    ProductsModule,
    FeaturedProductsModule,
    BookingsModule,
    NotificationsModule,
    TypeOrmModule.forFeature([SellerEntity, ServiceEntity]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
