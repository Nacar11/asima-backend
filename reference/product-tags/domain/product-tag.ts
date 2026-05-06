import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';

export class ProductTag {
  @ApiProperty({
    type: Number,
    description: 'Unique identifier',
  })
  id: number;

  @ApiProperty({
    type: Number,
    description: 'Product ID',
  })
  product_id: number;

  @ApiProperty({
    type: Number,
    description: 'Tag ID',
  })
  tag_id: number;

  @ApiProperty({
    type: Number,
    description: 'Display order for tags on product',
    default: 0,
  })
  tag_order: number;

  @ApiProperty({
    type: Date,
    description: 'When tag was assigned to product',
  })
  created_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who assigned the tag',
  })
  created_by?: User | null;
}
