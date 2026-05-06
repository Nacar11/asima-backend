import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CartItemOptionEntity } from '@/cart-item-options/persistence/entities/cart-item-option.entity';
import { CartItemOptionMapper } from '@/cart-item-options/persistence/mappers/cart-item-option.mapper';
import { CartItemOption } from '@/cart-item-options/domain/cart-item-option';

@Injectable()
export class CartItemOptionRepository {
  constructor(
    @InjectRepository(CartItemOptionEntity)
    private readonly repo: Repository<CartItemOptionEntity>,
  ) {}

  async create(
    data: Omit<CartItemOption, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<CartItemOption> {
    const saved = await this.repo.save(
      this.repo.create(CartItemOptionMapper.toPersistence(data)),
    );
    return CartItemOptionMapper.toDomain(saved);
  }

  async findByCartItemId(cartItemId: number): Promise<CartItemOption[]> {
    const entities = await this.repo.find({
      where: { cart_item_id: cartItemId },
      relations: ['option_group', 'option_value'],
    });
    return entities.map((e) => CartItemOptionMapper.toDomain(e));
  }

  async findByCartItemIdWithDetails(
    cartItemId: number,
  ): Promise<CartItemOptionEntity[]> {
    return this.repo.find({
      where: { cart_item_id: cartItemId },
      relations: ['option_group', 'option_value'],
    });
  }

  async findByCartItemIds(cartItemIds: number[]): Promise<CartItemOption[]> {
    if (cartItemIds.length === 0) return [];
    const entities = await this.repo.find({
      where: { cart_item_id: In(cartItemIds) },
      relations: ['option_group', 'option_value'],
    });
    return entities.map((e) => CartItemOptionMapper.toDomain(e));
  }

  async upsert(
    cartItemId: number,
    optionGroupId: number,
    optionValueId: number,
    quantity: number,
    priceAdjustment: number,
    durationAdjustmentMinutes: number,
  ): Promise<CartItemOption> {
    const existing = await this.repo.findOne({
      where: { cart_item_id: cartItemId, option_group_id: optionGroupId },
    });

    if (existing) {
      existing.option_value_id = optionValueId;
      existing.quantity = quantity;
      existing.price_adjustment = priceAdjustment;
      existing.duration_adjustment_minutes = durationAdjustmentMinutes;
      const updated = await this.repo.save(existing);
      return CartItemOptionMapper.toDomain(updated);
    }

    const created = await this.repo.save(
      this.repo.create({
        cart_item_id: cartItemId,
        option_group_id: optionGroupId,
        option_value_id: optionValueId,
        quantity,
        price_adjustment: priceAdjustment,
        duration_adjustment_minutes: durationAdjustmentMinutes,
      }),
    );
    return CartItemOptionMapper.toDomain(created);
  }

  async removeAllForCartItem(cartItemId: number): Promise<void> {
    await this.repo.delete({ cart_item_id: cartItemId });
  }

  async syncOptions(
    cartItemId: number,
    options: {
      option_group_id: number;
      option_value_id: number;
      quantity: number;
      price_adjustment: number;
      duration_adjustment_minutes: number;
    }[],
  ): Promise<CartItemOption[]> {
    // Remove existing options for this cart item
    await this.removeAllForCartItem(cartItemId);

    // Insert new options
    const created: CartItemOption[] = [];
    for (const opt of options) {
      const item = await this.create({
        cart_item_id: cartItemId,
        option_group_id: opt.option_group_id,
        option_value_id: opt.option_value_id,
        quantity: opt.quantity,
        price_adjustment: opt.price_adjustment,
        duration_adjustment_minutes: opt.duration_adjustment_minutes,
      });
      created.push(item);
    }

    return created;
  }
}
