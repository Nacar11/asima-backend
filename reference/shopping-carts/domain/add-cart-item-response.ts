import { ApiProperty } from '@nestjs/swagger';
import { CartSummary } from './cart-summary';
import { ShoppingCartItem } from './shopping-cart-item';

/**
 * Store metadata for the item affected by an add-to-cart request.
 */
export class AddCartItemStoreInfo {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Seller ID for the affected cart item',
  })
  seller_id: number;

  @ApiProperty({
    type: String,
    example: 'Tech Store',
    description: 'Store name for the affected cart item',
  })
  store_name: string;
}

/**
 * Response for adding a product item to the cart.
 *
 * Keeps cart summary fields at the top level for backward compatibility and
 * includes only the affected cart item plus its store metadata.
 */
export class AddCartItemResponse extends CartSummary {
  @ApiProperty({
    type: () => ShoppingCartItem,
    description: 'The cart item created or updated by the add-to-cart request',
  })
  item: ShoppingCartItem;

  @ApiProperty({
    type: () => AddCartItemStoreInfo,
    description: 'Store metadata for the affected cart item',
  })
  store: AddCartItemStoreInfo;
}
