import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnRequestEntity } from './persistence/entities/return-request.entity';
import { ReturnRequestItemEntity } from './persistence/entities/return-request-item.entity';
import { ReturnRequestMediaMappingEntity } from '@/media/persistence/entities/return-request-media-mapping.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ReturnRequestRepository } from './persistence/repositories/return-request.repository';
import { ReturnRequestItemRepository } from './persistence/repositories/return-request-item.repository';
import { ReturnRequestsService } from './return-requests.service';
import { ReturnRequestsSchedulerService } from './return-requests-scheduler.service';
import { OrderTrackingModule } from '@/order-tracking/order-tracking.module';
import { MediaUsersModule } from '@/media/users/media-users.module';
import { MediaSharedModule } from '@/media/shared/media-shared.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { CheckoutPaymentsModule } from '@/checkout-payments/checkout-payments.module';
import { WalletsModule } from '@/wallets/wallets.module';
import { PayoutsModule } from '@/payouts/payouts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReturnRequestEntity,
      ReturnRequestItemEntity,
      ReturnRequestMediaMappingEntity,
      SalesOrderEntity,
      SalesOrderItemEntity,
      UserEntity,
    ]),
    OrderTrackingModule,
    MediaUsersModule,
    MediaSharedModule,
    forwardRef(() => NotificationsModule),
    CheckoutPaymentsModule,
    WalletsModule,
    PayoutsModule,
  ],
  providers: [
    ReturnRequestsService,
    ReturnRequestsSchedulerService,
    ReturnRequestRepository,
    ReturnRequestItemRepository,
  ],
  exports: [ReturnRequestsService],
})
export class ReturnRequestsModule {}
