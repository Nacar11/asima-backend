import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { ShoppingCartItemEntity } from '@/shopping-carts/persistence/entities/shopping-cart-item.entity';
import { ServiceOptionGroupEntity } from '@/service-option-groups/persistence/entities/service-option-group.entity';
import { ServiceOptionValueEntity } from '@/service-option-values/persistence/entities/service-option-value.entity';

@Entity({ name: 'cart_item_options' })
@Index(['cart_item_id'])
export class CartItemOptionEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  cart_item_id: number;

  @ManyToOne(() => ShoppingCartItemEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cart_item_id' })
  cart_item: ShoppingCartItemEntity;

  @Column({ type: 'int', nullable: false })
  option_group_id: number;

  @ManyToOne(() => ServiceOptionGroupEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'option_group_id' })
  option_group: ServiceOptionGroupEntity;

  @Column({ type: 'int', nullable: false })
  option_value_id: number;

  @ManyToOne(() => ServiceOptionValueEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'option_value_id' })
  option_value: ServiceOptionValueEntity;

  // For counter-type options
  @Column({ type: 'int', default: 1, nullable: false })
  quantity: number;

  // Price impact snapshot
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    nullable: false,
  })
  price_adjustment: number;

  @Column({ type: 'int', default: 0, nullable: false })
  duration_adjustment_minutes: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
