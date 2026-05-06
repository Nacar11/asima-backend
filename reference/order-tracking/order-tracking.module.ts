import { Module } from '@nestjs/common';
import { OrderTrackingPersistenceModule } from './persistence/persistence.module';
import { OrderTrackingService } from './order-tracking.service';
import { OrderTrackingController } from './order-tracking.controller';
import { SalesOrderPersistenceModule } from '@/sales-orders/persistence/persistence.module';

@Module({
  imports: [OrderTrackingPersistenceModule, SalesOrderPersistenceModule],
  controllers: [OrderTrackingController],
  providers: [OrderTrackingService],
  exports: [OrderTrackingService],
})
export class OrderTrackingModule {}
