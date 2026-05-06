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
import { ServiceOptionGroupEntity } from '@/service-option-groups/persistence/entities/service-option-group.entity';
import { ServiceOptionValueEntity } from '@/service-option-values/persistence/entities/service-option-value.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Entity({ name: 'booking_options' })
@Index(['booking_id'])
@Index(['option_group_id'])
@Index(['option_value_id'])
export class BookingOptionEntity extends EntityHelper {
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
  option_group_id: number | null;

  @ManyToOne(() => ServiceOptionGroupEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'option_group_id' })
  option_group: ServiceOptionGroupEntity | null;

  @Column({ type: 'int', nullable: true })
  option_value_id: number | null;

  @ManyToOne(() => ServiceOptionValueEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'option_value_id' })
  option_value: ServiceOptionValueEntity | null;

  // Snapshot fields (preserved even if options are deleted/modified later)
  @Column({ type: 'varchar', length: 255, nullable: false })
  group_name: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  group_code: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  value_label: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  value_code: string;

  @Column({ type: 'int', default: 1, nullable: false })
  quantity: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    nullable: false,
  })
  price_adjustment: number;

  @Column({ type: 'int', default: 0, nullable: false })
  duration_adjustment_minutes: number;

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
