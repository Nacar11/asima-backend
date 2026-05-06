import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
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
  Allow,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';

class AspectRatingsDto {
  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  @Allow()
  punctuality?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  @Allow()
  quality?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  @Allow()
  communication?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  @Allow()
  professionalism?: number;
}

export class CreateReviewDto {
  @ApiProperty({ type: Number, example: 1 })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  sales_order_item_id: number;

  @ApiProperty({ type: Number, example: 5, minimum: 1, maximum: 5 })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

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

  @ApiProperty({ type: Boolean, example: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_anonymous?: boolean;

  @ApiPropertyOptional({
    enum: ['Active'],
    example: 'Active',
    description: 'Review status (ignored by server, always set to Active)',
  })
  @IsOptional()
  @Allow()
  status?: string;

  @ApiPropertyOptional({
    type: AspectRatingsDto,
    description: 'Aspect ratings for service reviews',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return plainToInstance(AspectRatingsDto, JSON.parse(value));
      } catch {
        return value;
      }
    }
    return plainToInstance(AspectRatingsDto, value);
  })
  @IsObject()
  @ValidateNested()
  @Type(() => AspectRatingsDto)
  aspect_ratings?: AspectRatingsDto;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Review images to upload (multiple files supported)',
    isArray: true,
  })
  @IsOptional()
  @Allow()
  files?: any;
}
