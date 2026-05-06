import { SalesOrderQuotationSnapshot } from '@/sales-order-quotation-snapshots/domain/sales-order-quotation-snapshot';

/**
 * Abstract repository interface for SalesOrderQuotationSnapshot.
 */
export abstract class BaseSalesOrderQuotationSnapshotRepository {
  abstract create(
    data: Omit<
      SalesOrderQuotationSnapshot,
      'id' | 'created_at' | 'updated_at' | 'deleted_at'
    >,
  ): Promise<SalesOrderQuotationSnapshot>;

  abstract createMany(
    data: Omit<
      SalesOrderQuotationSnapshot,
      'id' | 'created_at' | 'updated_at' | 'deleted_at'
    >[],
  ): Promise<SalesOrderQuotationSnapshot[]>;

  abstract findById(id: number): Promise<SalesOrderQuotationSnapshot | null>;

  abstract findBySalesOrderId(
    salesOrderId: number,
  ): Promise<SalesOrderQuotationSnapshot[]>;

  abstract findBySalesOrderItemId(
    salesOrderItemId: number,
  ): Promise<SalesOrderQuotationSnapshot[]>;

  abstract findBySourceQuotationId(
    quotationId: number,
  ): Promise<SalesOrderQuotationSnapshot[]>;
}
