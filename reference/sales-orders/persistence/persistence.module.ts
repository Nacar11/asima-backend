import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrderEntity } from './entities/sales-order.entity';
import { SalesOrderItemEntity } from './entities/sales-order-item.entity';
import { BaseSalesOrderRepository } from './base-sales-order.repository';
import { SalesOrderRepository } from './repositories/sales-order.repository';
import { SalesOrderMapper } from './mappers/sales-order.mapper';
import { SalesOrderItemMapper } from './mappers/sales-order-item.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([SalesOrderEntity, SalesOrderItemEntity])],
  providers: [
    SalesOrderMapper,
    SalesOrderItemMapper,
    {
      provide: BaseSalesOrderRepository,
      useClass: SalesOrderRepository,
    },
  ],
  exports: [
    TypeOrmModule,
    BaseSalesOrderRepository,
    SalesOrderMapper,
    SalesOrderItemMapper,
  ],
})
export class SalesOrderPersistenceModule {}
