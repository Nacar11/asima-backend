import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServicePackageStatusEnum } from '@/service-packages/enums/service-package-status.enum';

export class CreateServicePackageDto {
  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  service_id: number;

  @ApiProperty({ type: String, example: 'Standard Package' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ type: Number, example: 1999.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiPropertyOptional({ type: Number, example: 2499.99 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  compare_at_price?: number | null;

  @ApiPropertyOptional({ type: Number, example: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration_minutes?: number | null;

  @ApiPropertyOptional({
    description: 'Array of inclusions',
    example: [{ name: 'Deep cleaning', quantity: 1 }],
    type: Object,
    nullable: true,
  })
  @IsOptional()
  inclusions?: any | null;

  @ApiPropertyOptional({ type: Number, example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  max_bookings_per_day?: number | null;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  is_popular?: boolean;

  @ApiPropertyOptional({ type: Number, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  display_order?: number;

  @ApiPropertyOptional({
    enum: ServicePackageStatusEnum,
    default: ServicePackageStatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ServicePackageStatusEnum)
  status?: ServicePackageStatusEnum;
}
