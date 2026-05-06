import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderTrackingEventEntity } from './entities/order-tracking-event.entity';
import { BaseOrderTrackingEventRepository } from './base-order-tracking-event.repository';
import { OrderTrackingEventRepository } from './repositories/order-tracking-event.repository';
import { OrderTrackingEventMapper } from './mappers/order-tracking-event.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([OrderTrackingEventEntity])],
  providers: [
    OrderTrackingEventMapper,
    {
      provide: BaseOrderTrackingEventRepository,
      useClass: OrderTrackingEventRepository,
    },
  ],
  exports: [
    TypeOrmModule,
    BaseOrderTrackingEventRepository,
    OrderTrackingEventMapper,
  ],
})
export class OrderTrackingPersistenceModule {}
