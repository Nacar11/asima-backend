import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { MediaEntity } from '@/media/persistence/entities/media.entity';

/**
 * Category TypeORM entity
 */
@Entity({
  name: 'categories',
})
@Index(['category_name'])
@Index(['seller_id'])
@Index(['parent_category_id'])
@Index(['display_order'])
@Index(['media_id'])
export class CategoryEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  category_name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 100, nullable: false })
  slug: string;

  @Column({ type: 'int', default: 0, nullable: false })
  display_order: number;

  @Column({ type: 'int', nullable: true })
  parent_category_id: number | null;

  @ManyToOne(() => CategoryEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'parent_category_id' })
  parent_category: CategoryEntity | null;

  @Column({ type: 'int', nullable: true })
  seller_id: number | null;

  @Column({ type: 'int', nullable: true })
  media_id: number | null;

  @Column({ type: 'varchar', length: 20, default: 'Active', nullable: false })
  status: string;

  @ManyToOne(() => MediaEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'media_id' })
  media: MediaEntity | null;

  @ManyToOne(() => SellerEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @DeleteDateColumn()
  deleted_at?: Date | null;
}
