import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { ShoppingCartEntity } from './shopping-cart.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { ServicePackageEntity } from '@/service-packages/persistence/entities/service-package.entity';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';
import { CartItemAddonEntity } from '@/cart-item-addons/persistence/entities/cart-item-addon.entity';
import { CartItemOptionEntity } from '@/cart-item-options/persistence/entities/cart-item-option.entity';
import { FormSubmissionEntity } from '@/form-submissions/persistence/entities/form-submission.entity';

/**
 * ShoppingCartItem TypeORM entity.
 *
 * Represents the shopping_cart_items table. Each item belongs to a shopping cart
 * and can reference either a product variant (for products) or a service/package
 * (for services). Tracks quantity, scheduling information for services, and maintains
 * audit information.
 *
 * @version 2
 * @since 1.0.0
 */
@Entity({
  name: 'shopping_cart_items',
})
@Index('IDX_shopping_cart_items_shopping_cart_id', ['shopping_cart_id'])
@Index('IDX_shopping_cart_items_variant_id', ['variant_id'])
@Index('IDX_shopping_cart_items_service_id', ['service_id'])
@Index('IDX_shopping_cart_items_package_id', ['package_id'])
@Index('IDX_shopping_cart_items_item_type', ['item_type'])
@Index('IDX_shopping_cart_items_deleted_at', ['deleted_at'])
export class ShoppingCartItemEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'shopping_cart_id' })
  shopping_cart_id: number;

  @Column({ name: 'variant_id', nullable: true })
  variant_id: number | null;

  @Column({ name: 'service_id', nullable: true })
  service_id: number | null;

  @Column({ name: 'package_id', nullable: true })
  package_id: number | null;

  @Column({
    name: 'item_type',
    type: 'enum',
    enum: CartItemTypeEnum,
    default: CartItemTypeEnum.PRODUCT,
  })
  item_type: CartItemTypeEnum;

  @Column({ name: 'scheduled_date', type: 'date', nullable: true })
  scheduled_date: Date | null;

  @Column({ name: 'scheduled_start_time', type: 'time', nullable: true })
  scheduled_start_time: string | null;

  @Column({ name: 'scheduled_end_time', type: 'time', nullable: true })
  scheduled_end_time: string | null;

  @Column({ name: 'service_address_id', nullable: true })
  service_address_id: number | null;

  @ManyToOne(() => UserAddressEntity, {
    onDelete: 'SET NULL',
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: 'service_address_id' })
  service_address: UserAddressEntity | null;

  @Column({ name: 'special_requests', type: 'text', nullable: true })
  special_requests: string | null;

  /**
   * FK to form_submissions table.
   * Links customer's form submission (service requirements) to the cart item.
   * Used for reactive bookings where customer fills form before checkout.
   */
  @Column({ name: 'form_submission_id', nullable: true })
  form_submission_id: number | null;

  @ManyToOne(() => FormSubmissionEntity, {
    onDelete: 'SET NULL',
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: 'form_submission_id' })
  form_submission: FormSubmissionEntity | null;

  @Column({ name: 'quantity', default: 1 })
  quantity: number;

  @Column({ name: 'is_selected', default: false })
  is_selected: boolean;

  @Column({
    name: 'location_additional_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  location_additional_fee: number | null;

  @Column({
    name: 'appointment_location_type',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  appointment_location_type: string | null;

  @ManyToOne(() => ShoppingCartEntity, (cart) => cart.items, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'shopping_cart_id' })
  shopping_cart: ShoppingCartEntity;

  @ManyToOne(() => ProductVariantEntity, {
    onDelete: 'CASCADE',
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariantEntity | null;

  @ManyToOne(() => ServiceEntity, {
    onDelete: 'CASCADE',
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity | null;

  @ManyToOne(() => ServicePackageEntity, {
    onDelete: 'CASCADE',
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: 'package_id' })
  package: ServicePackageEntity | null;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at?: Date | null;

  @OneToMany(() => CartItemAddonEntity, (addon) => addon.cart_item, {
    eager: false,
  })
  cart_item_addons?: CartItemAddonEntity[];

  @OneToMany(() => CartItemOptionEntity, (option) => option.cart_item, {
    eager: false,
  })
  cart_item_options?: CartItemOptionEntity[];
}
