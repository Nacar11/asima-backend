import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { MembershipPaymentStatusEnum } from '@/memberships/enums/membership-payment-status.enum';

export class QueryMembershipPaymentDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  membership_id?: number;
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  user_id?: number;
  @ApiPropertyOptional({ enum: MembershipPaymentStatusEnum })
  @IsOptional()
  @IsEnum(MembershipPaymentStatusEnum)
  payment_status?: MembershipPaymentStatusEnum;
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
