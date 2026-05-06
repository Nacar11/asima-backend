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
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Entity({ name: 'booking_guests' })
@Index('IDX_booking_guests_booking_id', ['booking_id'])
@Index('IDX_booking_guests_booking_sort_order', ['booking_id', 'sort_order'], {
  unique: true,
})
export class BookingGuestEntity extends EntityHelper {
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

  @Column({ type: 'smallint', nullable: false, default: 1 })
  sort_order: number;

  @Column({ type: 'boolean', nullable: false, default: false })
  is_primary_contact: boolean;

  @Column({ type: 'varchar', length: 100, nullable: false })
  first_name: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  last_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

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
