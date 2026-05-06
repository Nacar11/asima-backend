import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';

export class Tag {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Unique identifier for the tag',
  })
  id: number;

  @ApiPropertyOptional({
    type: Number,
    example: 42,
    description: 'Seller ID who owns this tag (null for system tags)',
  })
  seller_id?: number | null;

  @ApiProperty({
    type: String,
    example: 'organic',
    description: 'Tag name (2-100 characters, unique)',
    minLength: 2,
    maxLength: 100,
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'organic',
    description: 'URL-friendly slug (auto-generated, unique)',
    minLength: 2,
    maxLength: 100,
  })
  slug: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Products that are organically grown',
    description: 'Optional description of the tag',
    maxLength: 200,
  })
  description?: string | null;

  @ApiProperty({
    type: Number,
    example: 42,
    description: 'Number of products using this tag',
    default: 0,
  })
  product_count: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Display order for custom sorting',
    default: 0,
  })
  display_order: number;

  @ApiProperty({
    enum: ['Active', 'Inactive'],
    example: 'Active',
    description: 'Tag status: Active or Inactive',
  })
  status: string;

  @ApiProperty({
    type: Date,
    description: 'Timestamp when the tag was created',
  })
  created_at: Date;

  @ApiProperty({
    type: Date,
    description: 'Timestamp when the tag was last updated',
  })
  updated_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who created this tag',
  })
  created_by?: User | null;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who last updated this tag',
  })
  updated_by?: User | null;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who deleted this tag',
  })
  deleted_by?: User | null;

  @ApiPropertyOptional({
    type: Date,
    description: 'Soft delete timestamp',
  })
  deleted_at?: Date | null;

  // Relations
  @ApiPropertyOptional({
    type: () => User,
    description: 'Seller who owns this tag',
  })
  seller?: User | null;
}
