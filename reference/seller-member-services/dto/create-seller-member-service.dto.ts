import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ProficiencyLevelEnum } from '@/seller-member-services/enums/proficiency-level.enum';

export class CreateSellerMemberServiceDto {
  @ApiProperty({ type: Number, example: 1 })
  @IsInt()
  seller_member_id: number;

  @ApiProperty({ type: Number, example: 10 })
  @IsInt()
  service_id: number;

  @ApiPropertyOptional({
    enum: ProficiencyLevelEnum,
    example: ProficiencyLevelEnum.STANDARD,
    default: ProficiencyLevelEnum.STANDARD,
  })
  @IsOptional()
  @IsEnum(ProficiencyLevelEnum)
  proficiency_level?: ProficiencyLevelEnum;

  @ApiPropertyOptional({ type: Boolean, example: false, default: false })
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @ApiPropertyOptional({ type: String, default: 'Active' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;
}
