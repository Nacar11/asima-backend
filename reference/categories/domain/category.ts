import { Exclude, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { Media } from '@/media/domain/media';
import { ActiveInactiveStatusEnum } from '@/utils/enums/status-enum';

/**
 * Category domain entity
 */
export class Category {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: String,
    example: 'Electronics',
  })
  category_name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Electronic devices and gadgets',
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    type: String,
    example: 'electronics',
  })
  slug: string;

  @ApiProperty({
    type: Number,
    example: 1,
  })
  display_order: number;

  @ApiPropertyOptional({
    type: String,
    example: '1.2',
    description:
      'Computed display order label showing parent-child hierarchy (e.g., "1", "1.1", "1.2")',
  })
  display_order_label?: string | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: null,
  })
  parent_category_id?: number | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Electronics',
    description: 'Name of the parent category',
  })
  parent_category_name?: string | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: null,
  })
  seller_id?: number | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: null,
    description: 'Media ID associated with this category image',
  })
  media_id?: number | null;

  @ApiProperty({
    enum: ActiveInactiveStatusEnum,
    example: ActiveInactiveStatusEnum.ACTIVE,
    description: 'Category status: Active or Inactive',
  })
  status: ActiveInactiveStatusEnum;

  @ApiProperty({
    type: Number,
    example: 42,
    description: 'Number of products in this category',
    default: 0,
  })
  product_count: number;

  @ApiProperty({
    type: Number,
    example: 5,
    description: 'Number of sub-categories under this category',
    default: 0,
  })
  sub_category_count?: number;

  @ApiPropertyOptional({
    type: () => [Category],
    nullable: true,
    description: 'Child categories nested under this parent (admin list view)',
  })
  @Type(() => Category)
  child_categories?: Category[];

  @ApiPropertyOptional({
    type: () => Media,
    nullable: true,
    description: 'Category image associated with this category',
  })
  category_image?: Media | null;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
    example: {
      id: 1,
      user_id: 1,
      store_name: 'Admin Store',
      is_verified: false,
      is_active: true,
    },
  })
  seller?: {
    id: number;
    user_id: number;
    store_name: string;
    is_verified: boolean;
    is_active: boolean;
    status: string;
  } | null;

  @ApiProperty({
    type: () => User,
    nullable: true,
    example: { id: 1, first_name: 'Admin', last_name: 'User' },
  })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({
    type: () => User,
    nullable: true,
    example: { id: 1, first_name: 'Admin', last_name: 'User' },
  })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    nullable: true,
    example: null,
  })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
  })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
