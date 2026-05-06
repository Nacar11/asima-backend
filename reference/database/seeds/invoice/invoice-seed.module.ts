import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceEntity } from '@/invoices/persistence/entities/invoice.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { InvoiceSeedService } from './invoice-seed.service';

/**
 * Seed module for invoices
 */
@Module({
  imports: [TypeOrmModule.forFeature([InvoiceEntity, SalesOrderEntity])],
  providers: [InvoiceSeedService],
  exports: [InvoiceSeedService],
})
export class InvoiceSeedModule {}
