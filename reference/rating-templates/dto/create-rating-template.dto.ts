import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { RatingTypeEnum } from '@/rating-templates/enums/rating-type.enum';

/**
 * DTO for creating a rating template.
 */
export class CreateRatingTemplateDto {
  @ApiProperty({
    example: 'Service Quality',
    description: 'Display name for the rating criteria',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'service_quality',
    description: 'Unique code identifier',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @ApiPropertyOptional({
    example: 'Rate the quality of service provided',
    description: 'Description of what this criteria measures',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: RatingTypeEnum,
    example: RatingTypeEnum.STARS,
    description: 'Type of rating input',
  })
  @IsEnum(RatingTypeEnum)
  @IsNotEmpty()
  rating_type: RatingTypeEnum;

  @ApiPropertyOptional({
    example: 1,
    description: 'Minimum allowed value',
    default: 1,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  min_value?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Maximum allowed value',
    default: 5,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  max_value?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this criteria is required',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_required?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Display order',
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  sequence_order?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this template is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
