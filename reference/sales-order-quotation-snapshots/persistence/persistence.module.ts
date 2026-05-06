import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrderQuotationSnapshotEntity } from '@/sales-order-quotation-snapshots/persistence/entities/sales-order-quotation-snapshot.entity';
import { SalesOrderQuotationSnapshotRepository } from '@/sales-order-quotation-snapshots/persistence/repositories/sales-order-quotation-snapshot.repository';
import { BaseSalesOrderQuotationSnapshotRepository } from '@/sales-order-quotation-snapshots/persistence/base-sales-order-quotation-snapshot.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SalesOrderQuotationSnapshotEntity])],
  providers: [
    {
      provide: BaseSalesOrderQuotationSnapshotRepository,
      useClass: SalesOrderQuotationSnapshotRepository,
    },
  ],
  exports: [BaseSalesOrderQuotationSnapshotRepository],
})
export class SalesOrderQuotationSnapshotPersistenceModule {}
