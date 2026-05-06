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
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';

/**
 * Cancellation Policy TypeORM entity.
 *
 * Represents cancellation policies that can be applied at platform, seller, or service level.
 * Defines refund rules based on cancellation timing.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({ name: 'cancellation_policies' })
@Index('IDX_cancellation_policies_seller_id', ['seller_id'])
@Index('IDX_cancellation_policies_service_id', ['service_id'])
@Index('IDX_cancellation_policies_status', ['status'])
export class CancellationPolicyEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  seller_id: number | null;

  @ManyToOne(() => SellerEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'seller_id' })
  seller?: SellerEntity | null;

  @Column({ type: 'int', nullable: true })
  service_id: number | null;

  @ManyToOne(() => ServiceEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'service_id' })
  service?: ServiceEntity | null;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', nullable: false, default: 48 })
  free_cancel_hours: number;

  @Column({ type: 'int', nullable: false, default: 24 })
  partial_cancel_hours: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: false,
    default: 50.0,
  })
  partial_cancel_percent: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: false,
    default: 100.0,
  })
  no_show_charge_percent: number;

  @Column({ type: 'varchar', length: 20, default: 'Active', nullable: false })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
