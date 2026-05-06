import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { MilestoneStatusEnum } from '@/booking-milestones/enums/milestone-status.enum';
import { MilestoneTypeEnum } from '@/booking-milestones/enums/milestone-type.enum';
import { ChecklistResponseTypeEnum } from '@/booking-milestones/enums/checklist-response-type.enum';

/**
 * Booking Milestone domain model.
 *
 * Represents a milestone in a service booking workflow.
 * Tracks progress, payment release, and approval status.
 *
 * @version 1
 * @since 1.0.0
 */
export class BookingMilestone {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Milestone ID',
  })
  id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Booking ID this milestone belongs to',
  })
  booking_id: number;

  @ApiPropertyOptional({
    type: Object,
    description: 'Booking details',
  })
  booking?: any;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Service milestone template ID (if created from template)',
    nullable: true,
  })
  template_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Template details',
    nullable: true,
  })
  template?: any;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description:
      'Quotation item ID this milestone was created from (preventive flow)',
    nullable: true,
  })
  source_quotation_item_id?: number | null;

  @ApiProperty({
    type: String,
    example: 'Initial Consultation',
    description: 'Milestone name',
  })
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Complete initial consultation with customer',
    description: 'Milestone description',
    nullable: true,
  })
  description?: string | null;

  // ==================== DPO Checklist Fields ====================

  @ApiProperty({
    enum: MilestoneTypeEnum,
    example: MilestoneTypeEnum.MILESTONE,
    description: 'Type: standard milestone or checklist item',
    default: MilestoneTypeEnum.MILESTONE,
  })
  milestone_type: MilestoneTypeEnum;

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
    type: Boolean,
    description: 'Checkbox response value',
    nullable: true,
  })
  checkbox_value?: boolean | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Text response value',
    nullable: true,
  })
  text_value?: string | null;

  @ApiPropertyOptional({
    type: Number,
    description: 'Rating response value (1-5)',
    nullable: true,
  })
  rating_value?: number | null;

  @ApiPropertyOptional({
    type: Number,
    description: 'Measurement response value',
    nullable: true,
  })
  measurement_value?: number | null;

  @ApiPropertyOptional({
    type: String,
    example: 'mm',
    description: 'Unit of measurement',
    nullable: true,
  })
  measurement_unit?: string | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Photo URLs for photo evidence',
    nullable: true,
  })
  photo_urls?: string[] | null;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Whether this checklist item is required',
    default: false,
  })
  is_required: boolean;

  // ==================== End DPO Checklist Fields ====================

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Sequence order of milestone (1, 2, 3, ...)',
  })
  sequence_order: number;

  @ApiProperty({
    enum: MilestoneStatusEnum,
    example: MilestoneStatusEnum.PENDING,
    description: 'Milestone status',
    default: MilestoneStatusEnum.PENDING,
  })
  status: MilestoneStatusEnum;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-25T09:00:00Z',
    description: 'When milestone work started',
    nullable: true,
  })
  started_at?: Date | null;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-25T11:00:00Z',
    description: 'When milestone was completed',
    nullable: true,
  })
  completed_at?: Date | null;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-25T12:00:00Z',
    description: 'When milestone was approved',
    nullable: true,
  })
  approved_at?: Date | null;

  @ApiProperty({
    type: Number,
    example: 30.0,
    description: 'Payment percentage for this milestone (e.g., 30.0 for 30%)',
  })
  payment_percent: number;

  @ApiProperty({
    type: Number,
    example: 450.0,
    description: 'Payment amount for this milestone',
  })
  payment_amount: number;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Whether payment has been released',
    default: false,
  })
  payment_released: boolean;

  @ApiPropertyOptional({
    type: Date,
    example: null,
    description: 'When payment was released',
    nullable: true,
  })
  payment_released_at?: Date | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Looks good!',
    description: 'Customer notes/feedback',
    nullable: true,
  })
  customer_notes?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: null,
    description: 'Rejection reason if milestone was rejected',
    nullable: true,
  })
  rejection_reason?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Completed as per requirements',
    description: 'Provider notes',
    nullable: true,
  })
  provider_notes?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'User ID who approved the milestone',
    nullable: true,
  })
  approved_by?: number | null;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who approved the milestone',
    nullable: true,
  })
  approved_by_user?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Whether milestone was auto-approved',
    default: false,
  })
  auto_approved: boolean;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-25T10:00:00Z',
    description: 'When milestone was submitted for approval',
    nullable: true,
  })
  submitted_at?: Date | null;

  @ApiProperty({
    type: Number,
    example: 48,
    description: 'Hours after submission before auto-approval',
    default: 48,
  })
  auto_approve_after_hours: number;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who created this milestone',
  })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    example: '2024-12-11T09:00:00Z',
    description: 'Creation timestamp',
  })
  created_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who last updated this milestone',
  })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    example: '2024-12-11T09:05:00Z',
    description: 'Last update timestamp',
  })
  updated_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who deleted this milestone',
  })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({
    type: Date,
    example: null,
    description: 'Deletion timestamp (null if not deleted)',
  })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
