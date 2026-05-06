import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteRequestsService } from './quote-requests.service';
import { QuoteRequestsController } from './quote-requests.controller';
import { QuoteRequestEntity } from './persistence/entities/quote-request.entity';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { ServicesModule } from '@/services/services.module';
import { SellersModule } from '@/sellers/sellers.module';
import { ServicePackagesModule } from '@/service-packages/service-packages.module';
import { BookingsModule } from '@/bookings/bookings.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { QuotationItemsModule } from '@/quotation-items/quotation-items.module';
import { FormSubmissionsModule } from '@/form-submissions/form-submissions.module';
import { ParametersModule } from '@/parameters/parameters.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuoteRequestEntity, BookingEntity]),
    forwardRef(() => ServicesModule),
    forwardRef(() => SellersModule),
    forwardRef(() => ServicePackagesModule),
    forwardRef(() => BookingsModule),
    NotificationsModule,
    forwardRef(() => QuotationItemsModule),
    FormSubmissionsModule,
    ParametersModule,
  ],
  controllers: [QuoteRequestsController],
  providers: [QuoteRequestsService],
  exports: [QuoteRequestsService],
})
export class QuoteRequestsModule {}
