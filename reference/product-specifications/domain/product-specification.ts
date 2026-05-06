import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { Product } from '@/products/domain/product';

/**
 * ProductSpecification domain entity
 */
export class ProductSpecification {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  product_id: number;

  @ApiProperty({ example: 'Display Size' })
  specification_name: string;

  @ApiPropertyOptional({ example: 'inches' })
  unit?: string;

  @ApiProperty({ example: '6.7' })
  specification_value: string;

  @ApiProperty({ example: 1 })
  sort_order: number;

  @ApiPropertyOptional({ type: () => Product })
  product?: Product;

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
