import { Injectable } from '@nestjs/common';
import { BaseSalesOrderQuotationSnapshotRepository } from '@/sales-order-quotation-snapshots/persistence/base-sales-order-quotation-snapshot.repository';
import { SalesOrderQuotationSnapshot } from '@/sales-order-quotation-snapshots/domain/sales-order-quotation-snapshot';

/**
 * Service for managing Sales Order Quotation Snapshots.
 *
 * Provides business logic for creating and retrieving immutable snapshots
 * of quotation items when sales orders are created.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class SalesOrderQuotationSnapshotsService {
  constructor(
    private readonly snapshotRepository: BaseSalesOrderQuotationSnapshotRepository,
  ) {}

  /**
   * Create a single snapshot record.
   *
   * @param data - Snapshot data
   * @returns Created snapshot
   */
  async create(
    data: Omit<
      SalesOrderQuotationSnapshot,
      'id' | 'created_at' | 'updated_at' | 'deleted_at'
    >,
  ): Promise<SalesOrderQuotationSnapshot> {
    return this.snapshotRepository.create(data);
  }

  /**
   * Create multiple snapshot records at once.
   *
   * @param data - Array of snapshot data
   * @returns Array of created snapshots
   */
  async createMany(
    data: Omit<
      SalesOrderQuotationSnapshot,
      'id' | 'created_at' | 'updated_at' | 'deleted_at'
    >[],
  ): Promise<SalesOrderQuotationSnapshot[]> {
    return this.snapshotRepository.createMany(data);
  }

  /**
   * Create snapshots from quotation items for a sales order.
   *
   * @param salesOrderId - The sales order ID
   * @param quotationId - The source quotation ID
   * @param quotationItems - Array of quotation items to snapshot
   * @param salesOrderItemMap - Map of quotation_item_id to sales_order_item_id
   * @param userId - User creating the snapshots
   * @returns Array of created snapshots
   */
  async createFromQuotationItems(
    salesOrderId: number,
    quotationId: number,
    quotationItems: Array<{
      id: number;
      item_type: string;
      service_id?: number | null;
      product_id?: number | null;
      name: string;
      description?: string | null;
      quantity: number;
      unit_type?: string | null;
      unit_price: number;
      total_price: number;
      scheduled_date?: Date | null;
      scheduled_start_time?: string | null;
      service_address_id?: number | null;
      service_address_text?: string | null;
      service_latitude?: number | null;
      service_longitude?: number | null;
      sequence_order?: number | null;
    }>,
    salesOrderItemMap: Map<number, number>,
    userId?: number,
  ): Promise<SalesOrderQuotationSnapshot[]> {
    const snapshotsData = quotationItems.map((item) => ({
      sales_order_id: salesOrderId,
      sales_order_item_id: salesOrderItemMap.get(item.id) ?? null,
      source_quotation_id: quotationId,
      source_quotation_item_id: item.id,
      item_type: item.item_type,
      service_id: item.service_id ?? null,
      product_id: item.product_id ?? null,
      name: item.name,
      description: item.description ?? null,
      quantity: item.quantity,
      unit_type: item.unit_type ?? null,
      unit_price: item.unit_price,
      total_price: item.total_price,
      scheduled_date: item.scheduled_date ?? null,
      scheduled_start_time: item.scheduled_start_time ?? null,
      service_address_id: item.service_address_id ?? null,
      service_address_text: item.service_address_text ?? null,
      service_latitude: item.service_latitude ?? null,
      service_longitude: item.service_longitude ?? null,
      sequence_order: item.sequence_order ?? null,
      created_by: userId ?? null,
      updated_by: userId ?? null,
    }));

    return this.snapshotRepository.createMany(snapshotsData);
  }

  /**
   * Find snapshot by ID.
   *
   * @param id - Snapshot ID
   * @returns Snapshot or null
   */
  async findById(id: number): Promise<SalesOrderQuotationSnapshot | null> {
    return this.snapshotRepository.findById(id);
  }

  /**
   * Find all snapshots for a sales order.
   *
   * @param salesOrderId - Sales order ID
   * @returns Array of snapshots
   */
  async findBySalesOrderId(
    salesOrderId: number,
  ): Promise<SalesOrderQuotationSnapshot[]> {
    return this.snapshotRepository.findBySalesOrderId(salesOrderId);
  }

  /**
   * Find all snapshots for a sales order item.
   *
   * @param salesOrderItemId - Sales order item ID
   * @returns Array of snapshots
   */
  async findBySalesOrderItemId(
    salesOrderItemId: number,
  ): Promise<SalesOrderQuotationSnapshot[]> {
    return this.snapshotRepository.findBySalesOrderItemId(salesOrderItemId);
  }

  /**
   * Find all snapshots created from a specific quotation.
   *
   * @param quotationId - Source quotation ID
   * @returns Array of snapshots
   */
  async findBySourceQuotationId(
    quotationId: number,
  ): Promise<SalesOrderQuotationSnapshot[]> {
    return this.snapshotRepository.findBySourceQuotationId(quotationId);
  }
}
