import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItemOptionEntity } from '@/cart-item-options/persistence/entities/cart-item-option.entity';
import { CartItemOptionRepository } from '@/cart-item-options/persistence/repositories/cart-item-option.repository';

/**
 * Cart Item Options Module.
 *
 * @deprecated This module is deprecated. Use FormSubmissionsModule instead.
 * Form submissions store customer selections for form template fields.
 * This module is kept for backward compatibility with existing data
 * but should not be used for new implementations.
 *
 * Migration guide:
 * - Cart item options → Form submission values
 *
 * @see FormSubmissionsModule
 * @see FormSubmissionValuesEntity
 */
@Module({
  imports: [TypeOrmModule.forFeature([CartItemOptionEntity])],
  providers: [CartItemOptionRepository],
  exports: [CartItemOptionRepository],
})
export class CartItemOptionsModule {}
