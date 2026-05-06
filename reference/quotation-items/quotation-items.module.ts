import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotationItemsService } from './quotation-items.service';
import { QuotationItemsController } from './quotation-items.controller';
import { QuotationItemEntity } from './persistence/entities/quotation-item.entity';
import { QuoteRequestsModule } from '@/quote-requests/quote-requests.module';
import { ServicesModule } from '@/services/services.module';
import { ProductsModule } from '@/products/products.module';
import { SellersModule } from '@/sellers/sellers.module';
import { BookingPersistenceModule } from '@/bookings/persistence/persistence.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuotationItemEntity]),
    forwardRef(() => QuoteRequestsModule),
    forwardRef(() => ServicesModule),
    forwardRef(() => ProductsModule),
    forwardRef(() => SellersModule),
    BookingPersistenceModule,
  ],
  controllers: [QuotationItemsController],
  providers: [QuotationItemsService],
  exports: [QuotationItemsService],
})
export class QuotationItemsModule {}
