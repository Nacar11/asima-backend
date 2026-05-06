import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for individual rating item submission.
 */
export class CreateRatingItemDto {
  @ApiProperty({ description: 'Rating Template ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  rating_template_id: number;

  @ApiProperty({
    description: 'Rating value',
    example: 4.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  value: number;
}

/**
 * DTO for creating a new rating submission.
 */
export class CreateRatingDto {
  @ApiProperty({ description: 'Booking ID to rate', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  booking_id: number;

  @ApiPropertyOptional({
    description: 'Additional review comment',
    example: 'Great service, very professional!',
  })
  @IsString()
  @IsOptional()
  review_comment?: string;

  @ApiPropertyOptional({
    description: 'Whether the rating is visible publicly',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_public?: boolean;

  @ApiProperty({
    description: 'Individual rating items for each criteria',
    type: [CreateRatingItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRatingItemDto)
  items: CreateRatingItemDto[];
}
