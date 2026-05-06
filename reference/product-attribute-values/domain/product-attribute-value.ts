import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Causer } from '@/utils/domain/causer';

/**
 * ProductAttributeValue domain entity
 */
export class ProductAttributeValue {
  @ApiProperty({ description: 'Product attribute value ID' })
  id: number;

  @ApiProperty({ description: 'Product variant ID' })
  product_variant_id: number;

  @ApiProperty({ description: 'Product attribute ID' })
  product_attribute_id: number;

  @ApiProperty({ description: 'Attribute value ID' })
  attribute_value_id: number;

  @ApiProperty({
    description:
      'Whether this is the default value within its product_attribute_id group',
    default: false,
  })
  is_default: boolean;

  @ApiPropertyOptional({
    type: () => 'object',
    description: 'User who created this record',
  })
  created_by?: Causer;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: Date;

  @ApiPropertyOptional({
    type: () => 'object',
    description: 'User who last updated this record',
  })
  updated_by?: Causer;

  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: Date;

  @ApiPropertyOptional({
    type: () => 'object',
    description: 'User who deleted this record',
  })
  deleted_by?: Causer;

  @ApiPropertyOptional({ description: 'Deletion timestamp' })
  deleted_at?: Date;

  @Exclude()
  __entity?: string;
}
