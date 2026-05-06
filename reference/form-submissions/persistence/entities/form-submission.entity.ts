import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { FormSubmissionValueEntity } from './form-submission-value.entity';

@Entity({ name: 'form_submissions' })
@Index(['service_id'])
@Index(['customer_id'])
@Index(['booking_id'])
@Index(['quotation_id'])
@Index(['deleted_at'])
export class FormSubmissionEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  service_id: number;

  @ManyToOne(() => ServiceEntity, { nullable: false })
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity;

  @Column({ type: 'int', nullable: false })
  customer_id: number;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: UserEntity;

  @Column({ type: 'int', nullable: true })
  booking_id: number | null;

  @ManyToOne(() => BookingEntity, { nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking: BookingEntity | null;

  @Column({ type: 'int', nullable: true })
  quotation_id: number | null;

  // Note: Not adding ManyToOne for quotation_id to avoid circular dependency
  // Can be joined via query when needed

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  submitted_at: Date;

  // Relations
  @OneToMany(
    () => FormSubmissionValueEntity,
    (value) => value.form_submission,
    { cascade: true, eager: false },
  )
  values: FormSubmissionValueEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at?: Date | null;
}
