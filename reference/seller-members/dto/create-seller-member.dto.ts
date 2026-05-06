import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
} from 'class-validator';
import { SellerMemberStatusEnum } from '@/seller-members/enums/seller-member-status.enum';

export class CreateSellerMemberDto {
  @ApiProperty({ type: Number, example: 1 })
  @IsInt()
  seller_id: number;

  @ApiProperty({ type: Number, example: 2 })
  @IsInt()
  user_id: number;

  @ApiPropertyOptional({ type: String, example: 'member' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  role?: string;

  @ApiPropertyOptional({ type: Boolean, example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_service_provider?: boolean;

  @ApiPropertyOptional({ type: Number, example: 8, default: 8 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  max_daily_bookings?: number;

  @ApiPropertyOptional({ type: Number, example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  max_concurrent_bookings?: number;

  @ApiPropertyOptional({ type: Number, example: 8.0, default: 8 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  service_capacity_hours?: number;

  @ApiPropertyOptional({ type: Boolean, example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_available_for_booking?: boolean;

  @ApiPropertyOptional({ type: String, example: 'Jane D.' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  display_name?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/member.png',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  profile_image_url?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Expert hairstylist with 5 years experience.',
  })
  @IsOptional()
  @IsString()
  bio?: string | null;

  @ApiPropertyOptional({
    enum: SellerMemberStatusEnum,
    example: SellerMemberStatusEnum.ACTIVE,
    default: SellerMemberStatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsEnum(SellerMemberStatusEnum)
  status?: SellerMemberStatusEnum;
}
