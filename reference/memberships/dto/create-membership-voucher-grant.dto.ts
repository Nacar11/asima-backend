import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MembershipVoucherGrantTypeEnum } from '@/memberships/enums/membership-voucher-grant-type.enum';

export class CreateMembershipVoucherGrantDto {
  @ApiProperty({ type: Number, example: 1 })
  @IsInt()
  @Min(1)
  membership_id: number;
  @ApiProperty({ type: Number, example: 10 })
  @IsInt()
  @Min(1)
  user_id: number;
  @ApiPropertyOptional({ type: Number, example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  membership_payment_id?: number;
  @ApiProperty({ type: String, example: 'WELCOME-FOOD-10PCT' })
  @IsString()
  @MaxLength(100)
  voucher_code: string;
  @ApiProperty({
    enum: MembershipVoucherGrantTypeEnum,
    example: MembershipVoucherGrantTypeEnum.WELCOME,
  })
  @IsEnum(MembershipVoucherGrantTypeEnum)
  grant_type: MembershipVoucherGrantTypeEnum;
}
