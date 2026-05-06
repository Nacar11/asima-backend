import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { Seller } from '@/sellers/domain/seller';
import { AttributeValue } from '@/attribute-values/domain/attribute-value';

export class Attribute {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  seller_id: number;

  @ApiProperty({ example: 'Size' })
  name: string;

  @ApiProperty({
    example: 'Active',
    enum: ['Active', 'Inactive'],
  })
  status: string;

  @ApiProperty({
    type: Number,
    example: 10,
    description: 'Number of products using this attribute',
    default: 0,
  })
  product_count?: number;

  @ApiPropertyOptional({ type: Seller })
  seller?: Seller;

  @ApiPropertyOptional({
    type: () => [AttributeValue],
    description: 'Array of attribute values for this attribute',
  })
  attribute_values?: AttributeValue[];

  @ApiPropertyOptional({ type: () => User, required: false })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({ type: () => User, required: false })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({ type: () => User, required: false })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updated_at: Date;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z', required: false })
  deleted_at?: Date;

  @Exclude()
  __entity?: string;
}
