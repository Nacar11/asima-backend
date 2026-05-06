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
import { ServiceAddonEntity } from '@/service-addons/persistence/entities/service-addon.entity';

@Entity({ name: 'cart_item_addons' })
@Index(['cart_item_id'])
@Index(['addon_id'])
export class CartItemAddonEntity extends EntityHelper {
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
  addon_id: number;

  @ManyToOne(() => ServiceAddonEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'addon_id' })
  addon: ServiceAddonEntity;

  @Column({ type: 'int', default: 1, nullable: false })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  unit_price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  total_price: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
