import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnRequestEntity } from '@/return-requests/persistence/entities/return-request.entity';
import { ReturnRequestItemEntity } from '@/return-requests/persistence/entities/return-request-item.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { OrderTrackingEventEntity } from '@/order-tracking/persistence/entities/order-tracking-event.entity';
import { ReturnRequestSeedService } from './return-request-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReturnRequestEntity,
      ReturnRequestItemEntity,
      SalesOrderEntity,
      SalesOrderItemEntity,
      UserEntity,
      OrderTrackingEventEntity,
    ]),
  ],
  providers: [ReturnRequestSeedService],
  exports: [ReturnRequestSeedService],
})
export class ReturnRequestSeedModule {}
