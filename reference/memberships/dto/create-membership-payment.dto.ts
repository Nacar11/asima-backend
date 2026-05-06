import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MembershipPaymentStatusEnum } from '@/memberships/enums/membership-payment-status.enum';

export class CreateMembershipPaymentDto {
  @ApiProperty({ type: Number, example: 1 })
  @IsInt()
  @Min(1)
  membership_id: number;
  @ApiProperty({ type: Number, example: 10 })
  @IsInt()
  @Min(1)
  user_id: number;
  @ApiProperty({ type: Number, example: 1 })
  @IsInt()
  @Min(1)
  membership_plan_billing_period_id: number;
  @ApiProperty({ type: Number, example: 199 })
  @IsNumber()
  @Min(0)
  amount: number;
  @ApiPropertyOptional({ type: String, example: 'PHP', default: 'PHP' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;
  @ApiPropertyOptional({
    enum: MembershipPaymentStatusEnum,
    example: MembershipPaymentStatusEnum.PENDING,
  })
  @IsOptional()
  @IsEnum(MembershipPaymentStatusEnum)
  payment_status?: MembershipPaymentStatusEnum;
  @ApiPropertyOptional({ type: String, example: 'DP-20260225-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  provider_reference?: string;
  @ApiPropertyOptional({ type: Number, example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  attempt_number?: number;
}
