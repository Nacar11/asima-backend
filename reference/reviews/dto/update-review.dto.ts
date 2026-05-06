import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  IsObject,
  ValidateNested,
  MaxLength,
  MinLength,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

class AspectRatingsDto {
  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  punctuality?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  quality?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  communication?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  professionalism?: number;
}

export class UpdateReviewDto {
  @ApiPropertyOptional({ type: Number, example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'Excellent product! Highly recommended.',
  })
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : undefined;
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  comment?: string;

  @ApiPropertyOptional({ type: Boolean, example: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_anonymous?: boolean;

  @ApiPropertyOptional({
    type: AspectRatingsDto,
    description: 'Aspect ratings for service reviews',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AspectRatingsDto)
  aspect_ratings?: AspectRatingsDto;
}
