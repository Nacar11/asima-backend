import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Store Unavailability Entity.
 *
 * Represents time blocks when a seller is unavailable for bookings.
 * Simplified: No member-specific unavailability (seller is the provider).
 *
 * @version 2
 * @since 1.0.0
 */
@Entity({ name: 'store_unavailability' })
@Index(['seller_id'])
@Index(['service_id'])
@Index(['unavailable_date'])
@Index(['is_full_day'])
@Index(['status'])
@Index(['block_type'])
@Index(['open_play_event_id'])
export class StoreUnavailabilityEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  seller_id: number;

  @ManyToOne(() => SellerEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity;

  @Column({ type: 'int', nullable: true })
  service_id?: number | null;

  @ManyToOne(() => ServiceEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'service_id' })
  service?: ServiceEntity | null;

  @Column({ type: 'date', nullable: false })
  unavailable_date: string;

  @Column({ type: 'date', nullable: true })
  end_date?: string | null;

  @Column({ type: 'time', nullable: true })
  start_time?: string | null;

  @Column({ type: 'time', nullable: true })
  end_time?: string | null;

  @Column({ type: 'boolean', default: true, nullable: false })
  is_full_day: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason?: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    default: 'maintenance',
    nullable: false,
  })
  block_type: string;

  @Column({ type: 'int', nullable: true })
  open_play_event_id?: number | null;

  @Column({ type: 'varchar', length: 20, default: 'Active', nullable: false })
  status: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null;
}
