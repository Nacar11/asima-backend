import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrderItemAddonEntity } from '@/sales-order-item-addons/persistence/entities/sales-order-item-addon.entity';
import { SalesOrderItemAddonRepository } from '@/sales-order-item-addons/persistence/repositories/sales-order-item-addon.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SalesOrderItemAddonEntity])],
  providers: [SalesOrderItemAddonRepository],
  exports: [SalesOrderItemAddonRepository],
})
export class SalesOrderItemAddonsModule {}
