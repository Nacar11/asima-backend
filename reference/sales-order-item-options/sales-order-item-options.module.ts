import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrderItemOptionEntity } from '@/sales-order-item-options/persistence/entities/sales-order-item-option.entity';
import { SalesOrderItemOptionRepository } from '@/sales-order-item-options/persistence/repositories/sales-order-item-option.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SalesOrderItemOptionEntity])],
  providers: [SalesOrderItemOptionRepository],
  exports: [SalesOrderItemOptionRepository],
})
export class SalesOrderItemOptionsModule {}
