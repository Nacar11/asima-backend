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

/**
 * DTO for creating a review from a booking.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateBookingReviewDto {
  @ApiProperty({ type: Number, example: 5, minimum: 1, maximum: 5 })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    type: String,
    example: 'Excellent service! Highly recommended.',
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
    type: AspectRatingsDto,
    description: 'Aspect ratings for service reviews',
  })
  @IsOptional()
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
  files?: Express.Multer.File[];
}
