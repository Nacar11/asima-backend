import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Causer } from '@/utils/domain/causer';
import { ReturnRequestItemStatusEnum } from './return-request-item-status.enum';

export class ReturnRequestItem {
  @ApiProperty({
    description: 'Return request item ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Return request ID',
    example: 1,
  })
  return_request_id: number;

  @ApiProperty({
    description: 'Sales order item ID',
    example: 1,
  })
  sales_order_item_id: number;

  @ApiPropertyOptional({
    description: 'Sales order item details',
    type: 'object',
  })
  sales_order_item?: {
    id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
  };

  @ApiPropertyOptional({
    description: 'Product variant ID (for product items)',
    example: 1,
  })
  variant_id?: number | null;

  @ApiPropertyOptional({
    description: 'Product variant details',
    type: 'object',
  })
  variant?: {
    id: number;
    sku: string;
    name?: string;
    product?: {
      id: number;
      name: string;
      image_url?: string;
      thumbnail_url?: string;
    };
  };

  @ApiPropertyOptional({
    description: 'Service ID (for service items)',
    example: 1,
  })
  service_id?: number | null;

  @ApiPropertyOptional({
    description: 'Service details',
    type: 'object',
  })
  service?: {
    id: number;
    title: string;
    code: string;
    primary_image_url?: string | null;
  };

  @ApiProperty({
    description: 'Original quantity ordered',
    example: 4,
  })
  quantity_ordered: number;

  @ApiProperty({
    description: 'Quantity being returned',
    example: 1,
  })
  quantity_returning: number;

  @ApiProperty({
    description: 'Unit price at time of order',
    example: 50.0,
  })
  unit_price: number;

  @ApiProperty({
    description: 'Total return amount (quantity_returning * unit_price)',
    example: 50.0,
  })
  return_amount: number;

  @ApiProperty({
    description: 'Item status',
    enum: ReturnRequestItemStatusEnum,
    example: ReturnRequestItemStatusEnum.PENDING,
  })
  item_status: ReturnRequestItemStatusEnum;

  @ApiPropertyOptional({
    description: 'User who created this item',
  })
  created_by?: Causer;

  @ApiProperty({
    description: 'Creation timestamp',
  })
  created_at: Date;

  @ApiPropertyOptional({
    description: 'User who last updated this item',
  })
  updated_by?: Causer;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updated_at: Date;
}
