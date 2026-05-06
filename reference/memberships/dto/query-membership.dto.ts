import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { MembershipStatusEnum } from '@/memberships/enums/membership-status.enum';

export class QueryMembershipDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Search by member name or email',
  })
  @IsOptional()
  @IsString()
  search?: string;
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  user_id?: number;
  @ApiPropertyOptional({ enum: MembershipStatusEnum })
  @IsOptional()
  @IsEnum(MembershipStatusEnum)
  status?: MembershipStatusEnum;
  @ApiPropertyOptional({
    type: Number,
    description: 'Filter by membership plan billing period ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  membership_plan_billing_period_id?: number;
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description:
      'Filter memberships with starts_at greater than or equal value',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Filter memberships with starts_at less than or equal value',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;
  @ApiPropertyOptional({ type: Number, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;
  @ApiPropertyOptional({ type: Number, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;
}
