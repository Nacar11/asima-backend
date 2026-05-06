import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';

@Entity({ name: 'voucher_categories' })
@Index('IDX_voucher_categories_voucher_id', ['voucher_id'])
@Index('IDX_voucher_categories_category_id', ['category_id'])
@Index(
  'UQ_voucher_categories_voucher_id_category_id',
  ['voucher_id', 'category_id'],
  {
    unique: true,
  },
)
export class VoucherCategoryEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'int', nullable: false })
  voucher_id: number;
  @Column({ type: 'int', nullable: false })
  category_id: number;
  @ManyToOne(() => VoucherEntity, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'voucher_id' })
  voucher: VoucherEntity;
  @ManyToOne(() => CategoryEntity, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;
  @CreateDateColumn()
  created_at: Date;
}
