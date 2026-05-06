import { CartItemOption } from '@/cart-item-options/domain/cart-item-option';
import { CartItemOptionEntity } from '../entities/cart-item-option.entity';

export class CartItemOptionMapper {
  static toDomain(entity: CartItemOptionEntity): CartItemOption {
    const domain = new CartItemOption();
    domain.id = entity.id;
    domain.cart_item_id = entity.cart_item_id;
    domain.option_group_id = entity.option_group_id;
    domain.option_value_id = entity.option_value_id;
    domain.quantity = entity.quantity;
    domain.price_adjustment = Number(entity.price_adjustment);
    domain.duration_adjustment_minutes = entity.duration_adjustment_minutes;
    domain.created_at = entity.created_at;
    domain.updated_at = entity.updated_at;
    return domain;
  }

  static toPersistence(
    domain: Partial<CartItemOption>,
  ): Partial<CartItemOptionEntity> {
    const entity = new CartItemOptionEntity();
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.cart_item_id !== undefined)
      entity.cart_item_id = domain.cart_item_id;
    if (domain.option_group_id !== undefined)
      entity.option_group_id = domain.option_group_id;
    if (domain.option_value_id !== undefined)
      entity.option_value_id = domain.option_value_id;
    if (domain.quantity !== undefined) entity.quantity = domain.quantity;
    if (domain.price_adjustment !== undefined)
      entity.price_adjustment = domain.price_adjustment;
    if (domain.duration_adjustment_minutes !== undefined)
      entity.duration_adjustment_minutes = domain.duration_adjustment_minutes;
    return entity;
  }
}
