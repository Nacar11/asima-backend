import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceMilestoneTemplateStatusEnum } from '@/service-milestone-templates/enums/service-milestone-template-status.enum';
import { MilestoneTypeEnum } from '@/booking-milestones/enums/milestone-type.enum';
import { ChecklistResponseTypeEnum } from '@/booking-milestones/enums/checklist-response-type.enum';

export class CreateServiceMilestoneTemplateDto {
  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  service_id: number;

  @ApiPropertyOptional({ type: Number, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  package_id?: number | null;

  @ApiProperty({ type: String, example: 'Initial Consultation' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string | null;

  /** Type of template: milestone (payment) or checklist (assessment item). */
  @ApiPropertyOptional({
    type: String,
    enum: MilestoneTypeEnum,
    default: MilestoneTypeEnum.MILESTONE,
  })
  @IsOptional()
  @IsEnum(MilestoneTypeEnum)
  template_type?: MilestoneTypeEnum;

  /** Category grouping for checklist items (e.g. "Electrical", "Mechanical"). */
  @ApiPropertyOptional({ type: String, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string | null;

  /** Response type for checklist items (checkbox, text, rating, photo, measurement). */
  @ApiPropertyOptional({ type: String, enum: ChecklistResponseTypeEnum })
  @IsOptional()
  @IsEnum(ChecklistResponseTypeEnum)
  response_type?: ChecklistResponseTypeEnum | null;

  /** Unit for measurement response type (e.g. PSI, liters). */
  @ApiPropertyOptional({ type: String, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  measurement_unit?: string | null;

  /** Whether this checklist item is required for assessment completion. */
  @ApiPropertyOptional({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sequence_order: number;

  @ApiPropertyOptional({ type: Number, example: 2.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimated_duration_hours?: number | null;

  @ApiPropertyOptional({ type: Number, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimated_duration_days?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 50,
    description: 'Required for milestone type; use 0 for checklist.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  payment_percent?: number;

  @ApiPropertyOptional({
    description: 'Array of deliverables',
    example: [{ name: 'Photo', description: 'Before photo', type: 'photo' }],
    type: Object,
    nullable: true,
  })
  @IsOptional()
  deliverables?: any | null;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  requires_customer_approval?: boolean;

  @ApiPropertyOptional({ type: Number, default: 48 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  auto_approve_after_hours?: number;

  @ApiPropertyOptional({
    type: String,
    enum: ServiceMilestoneTemplateStatusEnum,
    description: 'Service Milestone Template status',
    default: ServiceMilestoneTemplateStatusEnum.ACTIVE,
    example: ServiceMilestoneTemplateStatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ServiceMilestoneTemplateStatusEnum, {
    message: 'status must be a valid status from the enum',
  })
  status?: ServiceMilestoneTemplateStatusEnum;
}
