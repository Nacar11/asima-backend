import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { QuotationItemTypeEnum } from '@/quotation-items/enums/quotation-item-type.enum';
import { User } from '@/users/domain/user';
import { Service } from '@/services/domain/service';
import { Product } from '@/products/domain/product';

/**
 * QuotationItem domain model.
 *
 * Represents an individual line item in a post-assessment quotation.
 * Can be either a service or material.
 *
 * @version 1
 * @since 1.0.0
 */
export class QuotationItem {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: Number, example: 1, description: 'Parent quotation ID' })
  quotation_id: number;

  @ApiProperty({
    enum: QuotationItemTypeEnum,
    example: QuotationItemTypeEnum.SERVICE,
    description: 'Type of line item: service or material',
  })
  item_type: QuotationItemTypeEnum;

  @ApiPropertyOptional({
    type: Number,
    example: 5,
    description: 'Service ID (for service items)',
    nullable: true,
  })
  service_id?: number | null;

  @ApiPropertyOptional({
    type: () => Service,
    description: 'Service details (for service items)',
    nullable: true,
  })
  service?: Service | null;

  @ApiPropertyOptional({
    type: Number,
    example: 10,
    description: 'Product ID (for material items)',
    nullable: true,
  })
  product_id?: number | null;

  @ApiPropertyOptional({
    type: () => Product,
    description: 'Product details (for material items)',
    nullable: true,
  })
  product?: Product | null;

  @ApiProperty({
    type: String,
    example: 'Compressor Replacement',
    description: 'Name/title of the line item',
  })
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Replace faulty compressor with new unit',
    description: 'Description of the work/material',
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Quantity',
    default: 1,
  })
  quantity: number;

  @ApiPropertyOptional({
    type: String,
    example: 'unit',
    description: 'Unit type (e.g., unit, hour, meter)',
    nullable: true,
  })
  unit_type?: string | null;

  @ApiProperty({
    type: Number,
    example: 5000.0,
    description: 'Price per unit',
  })
  unit_price: number;

  @ApiProperty({
    type: Number,
    example: 5000.0,
    description: 'Total price (quantity * unit_price)',
  })
  total_price: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    example: '2026-02-01',
    description: 'Suggested schedule date for this item',
    nullable: true,
  })
  suggested_schedule_date?: Date | null;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Order of items in the quotation',
    nullable: true,
  })
  sequence_order?: number | null;

  @ApiPropertyOptional({ type: () => User, nullable: true })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({ type: Date })
  created_at: Date;

  @ApiPropertyOptional({ type: () => User, nullable: true })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({ type: Date })
  updated_at: Date;

  @ApiPropertyOptional({ type: () => User, nullable: true })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
