import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReferralCodeStatusEnum } from '@/referral-codes/enums/referral-code-status.enum';

export class QueryReferralCodeDto {
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

  @ApiPropertyOptional({ enum: ReferralCodeStatusEnum })
  @IsOptional()
  @IsEnum(ReferralCodeStatusEnum)
  status?: ReferralCodeStatusEnum;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  search?: string;
}
