import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { ServicePackageEntity } from '@/service-packages/persistence/entities/service-package.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { MilestoneTypeEnum } from '@/booking-milestones/enums/milestone-type.enum';
import { ChecklistResponseTypeEnum } from '@/booking-milestones/enums/checklist-response-type.enum';

@Entity({ name: 'service_milestone_templates' })
@Index(['service_id'])
@Index(['package_id'])
@Index(['service_id', 'sequence_order'], { unique: true })
@Index(['status'])
export class ServiceMilestoneTemplateEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  service_id: number;

  @ManyToOne(() => ServiceEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity;

  @Column({ type: 'int', nullable: true })
  package_id: number | null;

  @ManyToOne(() => ServicePackageEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'package_id' })
  package?: ServicePackageEntity | null;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // ==================== DPO Checklist Template Fields ====================

  /**
   * Type of template: standard payment milestone or checklist item.
   */
  @Column({
    type: 'enum',
    enum: MilestoneTypeEnum,
    default: MilestoneTypeEnum.MILESTONE,
    nullable: false,
  })
  template_type: MilestoneTypeEnum;

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
   * Unit of measurement for MEASUREMENT response type.
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  measurement_unit: string | null;

  /**
   * Whether this checklist item is required for assessment completion.
   */
  @Column({ type: 'boolean', default: false, nullable: false })
  is_required: boolean;

  // ==================== End DPO Checklist Template Fields ====================

  @Column({ type: 'int', nullable: false })
  sequence_order: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  estimated_duration_hours: number | null;

  @Column({ type: 'int', nullable: true })
  estimated_duration_days: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: false })
  payment_percent: number;

  @Column({ type: 'jsonb', nullable: true })
  deliverables: any | null;

  @Column({ type: 'boolean', default: true, nullable: false })
  requires_customer_approval: boolean;

  @Column({ type: 'int', default: 48, nullable: false })
  auto_approve_after_hours: number;

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
