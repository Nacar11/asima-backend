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
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { ServiceAddonEntity } from '@/service-addons/persistence/entities/service-addon.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Entity({ name: 'booking_addons' })
@Index(['booking_id'])
@Index(['addon_id'])
export class BookingAddonEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  booking_id: number;

  @ManyToOne(() => BookingEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'booking_id' })
  booking: BookingEntity;

  @Column({ type: 'int', nullable: true })
  addon_id: number | null;

  @ManyToOne(() => ServiceAddonEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'addon_id' })
  addon: ServiceAddonEntity | null;

  // Snapshot fields (preserved even if addon is deleted/modified later)
  @Column({ type: 'varchar', length: 255, nullable: false })
  addon_name: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  addon_code: string;

  @Column({ type: 'text', nullable: true })
  addon_description: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  unit_type: string | null;

  @Column({ type: 'int', default: 1, nullable: false })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  unit_price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  total_price: number;

  @Column({ type: 'int', nullable: true })
  duration_minutes: number | null;

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
}
