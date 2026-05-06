import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceMilestoneTemplateStatusEnum } from '@/service-milestone-templates/enums/service-milestone-template-status.enum';
import { MilestoneTypeEnum } from '@/booking-milestones/enums/milestone-type.enum';

export class QueryServiceMilestoneTemplateDto {
  @ApiPropertyOptional({ description: 'Search by name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  service_id?: number;

  @ApiPropertyOptional({
    type: String,
    enum: MilestoneTypeEnum,
    description: 'Filter by template type: milestone or checklist',
  })
  @IsOptional()
  @IsEnum(MilestoneTypeEnum)
  template_type?: MilestoneTypeEnum;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  package_id?: number;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  requires_customer_approval?: boolean;

  @ApiPropertyOptional({
    type: String,
    enum: ServiceMilestoneTemplateStatusEnum,
    description: 'Service Milestone Template status',
  })
  @IsOptional()
  @IsEnum(ServiceMilestoneTemplateStatusEnum, {
    message: 'status must be a valid status from the enum',
  })
  status?: ServiceMilestoneTemplateStatusEnum;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  skip?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  take?: number;
}
