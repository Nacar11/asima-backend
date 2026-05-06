import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItemAddonEntity } from '@/cart-item-addons/persistence/entities/cart-item-addon.entity';
import { CartItemAddonRepository } from '@/cart-item-addons/persistence/repositories/cart-item-addon.repository';

/**
 * Cart Item Addons Module.
 *
 * @deprecated This module is deprecated. Use FormSubmissionsModule instead.
 * Form submissions store customer selections for form template fields.
 * This module is kept for backward compatibility with existing data
 * but should not be used for new implementations.
 *
 * Migration guide:
 * - Cart item addons → Form submission values with checkbox field_type
 *
 * @see FormSubmissionsModule
 * @see FormSubmissionValuesEntity
 */
@Module({
  imports: [TypeOrmModule.forFeature([CartItemAddonEntity])],
  providers: [CartItemAddonRepository],
  exports: [CartItemAddonRepository],
})
export class CartItemAddonsModule {}
