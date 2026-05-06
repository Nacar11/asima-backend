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
import { ServiceCategoryEntity } from '@/service-categories/persistence/entities/service-category.entity';

@Entity({ name: 'voucher_service_categories' })
@Index('IDX_voucher_service_categories_voucher_id', ['voucher_id'])
@Index('IDX_voucher_service_categories_service_category_id', [
  'service_category_id',
])
@Index(
  'UQ_voucher_service_categories_voucher_id_service_category_id',
  ['voucher_id', 'service_category_id'],
  {
    unique: true,
  },
)
export class VoucherServiceCategoryEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'int', nullable: false })
  voucher_id: number;
  @Column({ type: 'int', nullable: false })
  service_category_id: number;
  @ManyToOne(() => VoucherEntity, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'voucher_id' })
  voucher: VoucherEntity;
  @ManyToOne(() => ServiceCategoryEntity, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'service_category_id' })
  service_category: ServiceCategoryEntity;
  @CreateDateColumn()
  created_at: Date;
}
