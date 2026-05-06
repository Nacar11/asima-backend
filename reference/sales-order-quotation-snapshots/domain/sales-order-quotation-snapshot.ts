import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Sales Order Quotation Snapshot domain model.
 *
 * Represents an immutable snapshot of a quotation item captured
 * when a sales order is created from quotation checkout.
 *
 * @version 1
 * @since 1.0.0
 */
export class SalesOrderQuotationSnapshot {
  @ApiProperty({ example: 1 })
  id: number;

  // ==================== Sales Order References ====================

  @ApiProperty({ example: 1 })
  sales_order_id: number;

  @ApiPropertyOptional({ example: 1 })
  sales_order_item_id?: number | null;

  // ==================== Source Quotation References ====================

  @ApiProperty({ example: 1 })
  source_quotation_id: number;

  @ApiProperty({ example: 1 })
  source_quotation_item_id: number;

  // ==================== Item Details (Snapshot) ====================

  @ApiProperty({ example: 'service', enum: ['service', 'material'] })
  item_type: string;

  @ApiPropertyOptional({ example: 1 })
  service_id?: number | null;

  @ApiPropertyOptional({ example: 1 })
  product_id?: number | null;

  @ApiProperty({ example: 'Compressor Replacement' })
  name: string;

  @ApiPropertyOptional({ example: 'Replace faulty compressor with new unit' })
  description?: string | null;

  @ApiProperty({ example: 1 })
  quantity: number;

  @ApiPropertyOptional({ example: 'unit' })
  unit_type?: string | null;

  @ApiProperty({ example: 5000.0 })
  unit_price: number;

  @ApiProperty({ example: 5000.0 })
  total_price: number;

  // ==================== Schedule Details (Snapshot) ====================

  @ApiPropertyOptional({ example: '2026-02-15' })
  scheduled_date?: Date | null;

  @ApiPropertyOptional({ example: '09:00:00' })
  scheduled_start_time?: string | null;

  // ==================== Service Address (Snapshot) ====================

  @ApiPropertyOptional({ example: 1 })
  service_address_id?: number | null;

  @ApiPropertyOptional({ example: '123 Main St, Cebu City' })
  service_address_text?: string | null;

  @ApiPropertyOptional({ example: 10.332 })
  service_latitude?: number | null;

  @ApiPropertyOptional({ example: 123.905 })
  service_longitude?: number | null;

  // ==================== Sequence ====================

  @ApiPropertyOptional({ example: 1 })
  sequence_order?: number | null;

  // ==================== Audit Fields ====================

  @ApiPropertyOptional({ example: 1 })
  created_by?: number | null;

  @ApiProperty({ example: '2026-01-24T00:00:00.000Z' })
  created_at: Date;

  @ApiPropertyOptional({ example: 1 })
  updated_by?: number | null;

  @ApiProperty({ example: '2026-01-24T00:00:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({ example: null })
  deleted_by?: number | null;

  @ApiPropertyOptional({ example: null })
  deleted_at?: Date | null;
}
