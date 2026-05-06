import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { ShoppingCartItem } from './shopping-cart-item';
import { CartSummary } from './cart-summary';

/**
 * Cart items grouped by store/seller
 */
export class CartStore {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Seller ID',
  })
  seller_id: number;

  @ApiProperty({
    type: String,
    example: 'Tech Store',
    description: 'Store name',
  })
  store_name: string;

  @ApiProperty({
    type: () => [ShoppingCartItem],
    description: 'Items from this store',
  })
  items: ShoppingCartItem[];
}

/**
 * Shopping cart domain model.
 *
 * Represents a user's shopping cart with all items and calculated summary.
 * Each user has exactly one shopping cart (one-to-one relationship).
 * The cart contains multiple items, each referencing a product variant.
 *
 * @version 1
 * @since 1.0.0
 */
export class ShoppingCart {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Shopping cart ID',
  })
  id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'User ID who owns this cart',
  })
  user_id: number;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who owns this cart',
  })
  user?: Pick<User, 'id' | 'first_name' | 'last_name' | 'email'>;

  @Exclude()
  items?: ShoppingCartItem[];

  @ApiPropertyOptional({
    type: () => [CartStore],
    description: 'Items grouped by store/seller',
  })
  stores?: CartStore[];

  @ApiPropertyOptional({
    type: () => CartSummary,
    description: 'Calculated cart summary (item count, totals)',
  })
  summary?: CartSummary;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Stock warnings for items in the cart (low stock, out of stock)',
    example: ['Low stock: Only 5 item(s) remaining.'],
  })
  warnings?: string[];

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who created this cart',
  })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    example: '2024-01-01T00:00:00Z',
    description: 'Creation timestamp',
  })
  created_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who last updated this cart',
  })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    example: '2024-01-01T00:00:00Z',
    description: 'Last update timestamp',
  })
  updated_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who deleted this cart',
  })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({
    type: Date,
    example: null,
    description: 'Deletion timestamp (null if not deleted)',
  })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
