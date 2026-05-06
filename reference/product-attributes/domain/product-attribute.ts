import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { Product } from '@/products/domain/product';
import { Attribute } from '@/attributes/domain/attribute';

export class ProductAttribute {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  product_id: number;

  @ApiProperty({ example: 1 })
  attribute_id: number;

  @ApiProperty({
    example: [1, 2, 4],
    description:
      'Array of attribute value IDs. These IDs reference actual attribute values that belong to this attribute. See the attribute.attribute_values array for the actual values.',
  })
  attribute_value_ids: number[];

  @ApiProperty({ example: ['Whole Bean', 'Fine Grind'] })
  terms: string[];

  @ApiProperty({ type: Product })
  product: Product;

  @ApiProperty({ type: Attribute })
  attribute: Attribute;

  @ApiProperty({ type: () => User, required: false })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({ type: () => User, required: false })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({ type: () => User, required: false })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updated_at: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', required: false })
  deleted_at?: Date;

  @Exclude()
  __entity?: string;
}
