import { Module } from '@nestjs/common';
import { SalesOrderQuotationSnapshotPersistenceModule } from '@/sales-order-quotation-snapshots/persistence/persistence.module';
import { SalesOrderQuotationSnapshotsService } from '@/sales-order-quotation-snapshots/sales-order-quotation-snapshots.service';

/**
 * Sales Order Quotation Snapshots Module.
 *
 * Manages immutable snapshots of quotation items when sales orders are created.
 * This preserves the exact state of what was quoted, independent of any
 * future modifications to the original quotation or catalog items.
 *
 * @version 1
 * @since 1.0.0
 */
@Module({
  imports: [SalesOrderQuotationSnapshotPersistenceModule],
  providers: [SalesOrderQuotationSnapshotsService],
  exports: [SalesOrderQuotationSnapshotsService],
})
export class SalesOrderQuotationSnapshotsModule {}
