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
import { QuoteRequestEntity } from '@/quote-requests/persistence/entities/quote-request.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { QuotationItemTypeEnum } from '@/quotation-items/enums/quotation-item-type.enum';

/**
 * QuotationItem TypeORM Entity.
 *
 * Represents an individual line item in a post-assessment quotation.
 * Can be either a service (creates booking when accepted) or a material/product.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({ name: 'quotation_items' })
@Index(['quotation_id'])
@Index(['item_type'])
@Index(['deleted_at'])
export class QuotationItemEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  quotation_id: number;

  @ManyToOne(() => QuoteRequestEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quotation_id' })
  quotation: QuoteRequestEntity;

  @Column({
    type: 'enum',
    enum: QuotationItemTypeEnum,
    nullable: false,
  })
  item_type: QuotationItemTypeEnum;

  @Column({ type: 'int', nullable: true })
  service_id: number | null;

  @ManyToOne(() => ServiceEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity | null;

  @Column({ type: 'int', nullable: true })
  product_id: number | null;

  @ManyToOne(() => ProductEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity | null;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', default: 1, nullable: false })
  quantity: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit_type: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  unit_price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  total_price: number;

  @Column({ type: 'date', nullable: true })
  suggested_schedule_date: Date | null;

  @Column({ type: 'int', nullable: true })
  sequence_order: number | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by: UserEntity | null;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at: Date | null;
}
