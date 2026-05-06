import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { User } from '@/users/domain/user';
import { Service } from '@/services/domain/service';
import { ServicePackage } from '@/service-packages/domain/service-package';
import { ServiceMilestoneTemplateStatusEnum } from '@/service-milestone-templates/enums/service-milestone-template-status.enum';
import { MilestoneTypeEnum } from '@/booking-milestones/enums/milestone-type.enum';
import { ChecklistResponseTypeEnum } from '@/booking-milestones/enums/checklist-response-type.enum';

export class ServiceMilestoneTemplate {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  service_id: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  package_id?: number | null;

  @ApiProperty({ type: String, example: 'Initial Consultation' })
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null;

  // ==================== DPO Checklist Template Fields ====================

  @ApiProperty({
    enum: MilestoneTypeEnum,
    example: MilestoneTypeEnum.MILESTONE,
    description: 'Type: standard milestone or checklist item template',
    default: MilestoneTypeEnum.MILESTONE,
  })
  template_type: MilestoneTypeEnum;

  @ApiPropertyOptional({
    type: String,
    example: 'Electrical',
    description: 'Category grouping for checklist items',
    nullable: true,
  })
  category?: string | null;

  @ApiPropertyOptional({
    enum: ChecklistResponseTypeEnum,
    description: 'Type of response expected for checklist items',
    nullable: true,
  })
  response_type?: ChecklistResponseTypeEnum | null;

  @ApiPropertyOptional({
    type: String,
    example: 'mm',
    description: 'Unit of measurement for MEASUREMENT type',
    nullable: true,
  })
  measurement_unit?: string | null;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Whether this checklist item is required',
    default: false,
  })
  is_required: boolean;

  // ==================== End DPO Checklist Template Fields ====================

  @ApiProperty({ type: Number, example: 1 })
  sequence_order: number;

  @ApiPropertyOptional({ type: Number, example: 2.5 })
  estimated_duration_hours?: number | null;

  @ApiPropertyOptional({ type: Number, example: 1 })
  estimated_duration_days?: number | null;

  @ApiProperty({ type: Number, example: 50 })
  payment_percent: number;

  @ApiPropertyOptional({
    description: 'Array of deliverables',
    example: [{ name: 'Photo', description: 'Before photo', type: 'photo' }],
    type: Object,
    nullable: true,
  })
  deliverables?: any | null;

  @ApiProperty({ type: Boolean, default: true })
  requires_customer_approval: boolean;

  @ApiProperty({ type: Number, default: 48 })
  auto_approve_after_hours: number;

  @ApiProperty({
    type: String,
    enum: ServiceMilestoneTemplateStatusEnum,
    default: ServiceMilestoneTemplateStatusEnum.ACTIVE,
  })
  status: ServiceMilestoneTemplateStatusEnum;

  @ApiPropertyOptional({ type: () => Service, nullable: true })
  service?: Service | null;

  @ApiPropertyOptional({ type: () => ServicePackage, nullable: true })
  package?: ServicePackage | null;

  @ApiPropertyOptional({ type: () => User, nullable: true })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  created_at: Date;

  @ApiPropertyOptional({ type: () => User, nullable: true })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({ type: () => User, nullable: true })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional()
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
