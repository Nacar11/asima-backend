import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CartItemAddonEntity } from '@/cart-item-addons/persistence/entities/cart-item-addon.entity';
import { CartItemAddonMapper } from '@/cart-item-addons/persistence/mappers/cart-item-addon.mapper';
import { CartItemAddon } from '@/cart-item-addons/domain/cart-item-addon';

@Injectable()
export class CartItemAddonRepository {
  constructor(
    @InjectRepository(CartItemAddonEntity)
    private readonly repo: Repository<CartItemAddonEntity>,
  ) {}

  async create(
    data: Omit<CartItemAddon, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<CartItemAddon> {
    const saved = await this.repo.save(
      this.repo.create(CartItemAddonMapper.toPersistence(data)),
    );
    return CartItemAddonMapper.toDomain(saved);
  }

  async findByCartItemId(cartItemId: number): Promise<CartItemAddon[]> {
    const entities = await this.repo.find({
      where: { cart_item_id: cartItemId },
      relations: ['addon'],
    });
    return entities.map((e) => CartItemAddonMapper.toDomain(e));
  }

  async findByCartItemIdWithAddon(
    cartItemId: number,
  ): Promise<CartItemAddonEntity[]> {
    return this.repo.find({
      where: { cart_item_id: cartItemId },
      relations: ['addon', 'addon.inclusions'],
    });
  }

  async findByCartItemIds(cartItemIds: number[]): Promise<CartItemAddon[]> {
    if (cartItemIds.length === 0) return [];
    const entities = await this.repo.find({
      where: { cart_item_id: In(cartItemIds) },
      relations: ['addon'],
    });
    return entities.map((e) => CartItemAddonMapper.toDomain(e));
  }

  async upsert(
    cartItemId: number,
    addonId: number,
    quantity: number,
    unitPrice: number,
  ): Promise<CartItemAddon> {
    const existing = await this.repo.findOne({
      where: { cart_item_id: cartItemId, addon_id: addonId },
    });

    const totalPrice = quantity * unitPrice;

    if (existing) {
      existing.quantity = quantity;
      existing.unit_price = unitPrice;
      existing.total_price = totalPrice;
      const updated = await this.repo.save(existing);
      return CartItemAddonMapper.toDomain(updated);
    }

    const created = await this.repo.save(
      this.repo.create({
        cart_item_id: cartItemId,
        addon_id: addonId,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
      }),
    );
    return CartItemAddonMapper.toDomain(created);
  }

  async remove(cartItemId: number, addonId: number): Promise<void> {
    await this.repo.delete({ cart_item_id: cartItemId, addon_id: addonId });
  }

  async removeAllForCartItem(cartItemId: number): Promise<void> {
    await this.repo.delete({ cart_item_id: cartItemId });
  }

  async syncAddons(
    cartItemId: number,
    addons: { addon_id: number; quantity: number; unit_price: number }[],
  ): Promise<CartItemAddon[]> {
    // Remove existing addons for this cart item
    await this.removeAllForCartItem(cartItemId);

    // Insert new addons
    const created: CartItemAddon[] = [];
    for (const addon of addons) {
      const item = await this.create({
        cart_item_id: cartItemId,
        addon_id: addon.addon_id,
        quantity: addon.quantity,
        unit_price: addon.unit_price,
        total_price: addon.quantity * addon.unit_price,
      });
      created.push(item);
    }

    return created;
  }
}
