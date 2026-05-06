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
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { ServiceMilestoneTemplateEntity } from '@/service-milestone-templates/persistence/entities/service-milestone-template.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { MilestoneStatusEnum } from '@/booking-milestones/enums/milestone-status.enum';
import { MilestoneTypeEnum } from '@/booking-milestones/enums/milestone-type.enum';
import { ChecklistResponseTypeEnum } from '@/booking-milestones/enums/checklist-response-type.enum';

/**
 * Booking Milestone TypeORM entity.
 *
 * Represents the booking_milestones table. Tracks service booking progress
 * through milestone-based workflows with payment release and approval.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({
  name: 'booking_milestones',
})
@Index('IDX_booking_milestones_booking_id', ['booking_id'])
@Index('IDX_booking_milestones_status', ['status'])
@Index(
  'IDX_booking_milestones_booking_id_sequence_order',
  ['booking_id', 'sequence_order'],
  {
    unique: true,
  },
)
@Index('IDX_booking_milestones_deleted_at', ['deleted_at'])
export class BookingMilestoneEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  booking_id: number;

  @ManyToOne(() => BookingEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'booking_id' })
  booking: BookingEntity;

  @Column({ type: 'int', nullable: true })
  template_id: number | null;

  @ManyToOne(() => ServiceMilestoneTemplateEntity, {
    nullable: true,
    eager: false,
  })
  @JoinColumn({ name: 'template_id' })
  template: ServiceMilestoneTemplateEntity | null;

  /**
   * Phase D2: Quotation item this milestone was created from (preventive flow).
   * Links progress to quotation line so each service quotation item is one milestone.
   */
  @Column({ type: 'int', nullable: true })
  source_quotation_item_id: number | null;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // ==================== DPO Checklist Fields ====================

  /**
   * Type of milestone: standard payment milestone or checklist item.
   */
  @Column({
    type: 'enum',
    enum: MilestoneTypeEnum,
    default: MilestoneTypeEnum.MILESTONE,
    nullable: false,
  })
  milestone_type: MilestoneTypeEnum;

  /**
   * Category grouping for checklist items (e.g., "Electrical", "Mechanical").
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  /**
   * Type of response expected for checklist items.
   */
  @Column({
    type: 'enum',
    enum: ChecklistResponseTypeEnum,
    nullable: true,
  })
  response_type: ChecklistResponseTypeEnum | null;

  /**
   * Checkbox response value (for CHECKBOX type).
   */
  @Column({ type: 'boolean', nullable: true })
  checkbox_value: boolean | null;

  /**
   * Text response value (for TEXT type).
   */
  @Column({ type: 'text', nullable: true })
  text_value: string | null;

  /**
   * Rating response value (for RATING type, e.g., 1-5).
   */
  @Column({ type: 'smallint', nullable: true })
  rating_value: number | null;

  /**
   * Measurement response value (for MEASUREMENT type).
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  measurement_value: number | null;

  /**
   * Unit of measurement (e.g., "mm", "psi", "°C").
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  measurement_unit: string | null;

  /**
   * Photo URLs for photo evidence (for PHOTO type).
   */
  @Column({ type: 'jsonb', nullable: true })
  photo_urls: string[] | null;

  /**
   * Whether this checklist item is required for assessment completion.
   */
  @Column({ type: 'boolean', default: false, nullable: false })
  is_required: boolean;

  // ==================== End DPO Checklist Fields ====================

  @Column({ type: 'int', nullable: false })
  sequence_order: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: MilestoneStatusEnum.PENDING,
    nullable: false,
  })
  status: MilestoneStatusEnum;

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  due_date: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deadline_warning_notified: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  overdue_notified: Date | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: false,
  })
  payment_percent: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  payment_amount: number;

  @Column({ type: 'boolean', default: false, nullable: false })
  payment_released: boolean;

  @Column({ type: 'timestamp', nullable: true })
  payment_released_at: Date | null;

  @Column({ type: 'text', nullable: true })
  customer_notes: string | null;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string | null;

  @Column({ type: 'text', nullable: true })
  provider_notes: string | null;

  @Column({ type: 'int', nullable: true })
  approved_by: number | null;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'approved_by' })
  approved_by_user: UserEntity | null;

  @Column({ type: 'boolean', default: false, nullable: false })
  auto_approved: boolean;

  @Column({ type: 'timestamp', nullable: true })
  submitted_at: Date | null;

  @Column({ type: 'int', default: 48, nullable: false })
  auto_approve_after_hours: number;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at?: Date | null;
}
