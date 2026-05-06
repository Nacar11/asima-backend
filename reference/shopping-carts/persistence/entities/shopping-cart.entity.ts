import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ShoppingCartItemEntity } from './shopping-cart-item.entity';

/**
 * ShoppingCart TypeORM entity.
 *
 * Represents the shopping_carts table with a one-to-one relationship to users.
 * Each user can have only one shopping cart. The cart contains multiple items
 * through the items relation.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({
  name: 'shopping_carts',
})
@Index('IDX_shopping_carts_user_id', ['user_id'], { unique: true })
@Index('IDX_shopping_carts_deleted_at', ['deleted_at'])
export class ShoppingCartEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', unique: true })
  user_id: number;

  @OneToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @OneToMany(() => ShoppingCartItemEntity, (item) => item.shopping_cart, {
    eager: false,
  })
  items: ShoppingCartItemEntity[];

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
}
