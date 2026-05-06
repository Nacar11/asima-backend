import { CartItemAddon } from '@/cart-item-addons/domain/cart-item-addon';
import { CartItemAddonEntity } from '../entities/cart-item-addon.entity';

export class CartItemAddonMapper {
  static toDomain(entity: CartItemAddonEntity): CartItemAddon {
    const domain = new CartItemAddon();
    domain.id = entity.id;
    domain.cart_item_id = entity.cart_item_id;
    domain.addon_id = entity.addon_id;
    domain.quantity = entity.quantity;
    domain.unit_price = Number(entity.unit_price);
    domain.total_price = Number(entity.total_price);
    domain.created_at = entity.created_at;
    domain.updated_at = entity.updated_at;
    return domain;
  }

  static toPersistence(
    domain: Partial<CartItemAddon>,
  ): Partial<CartItemAddonEntity> {
    const entity = new CartItemAddonEntity();
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.cart_item_id !== undefined)
      entity.cart_item_id = domain.cart_item_id;
    if (domain.addon_id !== undefined) entity.addon_id = domain.addon_id;
    if (domain.quantity !== undefined) entity.quantity = domain.quantity;
    if (domain.unit_price !== undefined) entity.unit_price = domain.unit_price;
    if (domain.total_price !== undefined)
      entity.total_price = domain.total_price;
    return entity;
  }
}
