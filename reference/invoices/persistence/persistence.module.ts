import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceEntity } from './entities/invoice.entity';
import { InvoiceRepository } from './repositories/invoice.repository';
import { BaseInvoiceRepository } from './repositories/base-invoice.repository';

@Module({
  imports: [TypeOrmModule.forFeature([InvoiceEntity])],
  providers: [
    {
      provide: BaseInvoiceRepository,
      useClass: InvoiceRepository,
    },
  ],
  exports: [BaseInvoiceRepository],
})
export class InvoicePersistenceModule {}
