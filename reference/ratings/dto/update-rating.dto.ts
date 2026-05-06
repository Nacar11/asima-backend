import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO for updating a rating (customer can update comment and visibility).
 */
export class UpdateRatingDto {
  @ApiPropertyOptional({
    description: 'Updated review comment',
    example: 'Updated: Great service!',
  })
  @IsString()
  @IsOptional()
  review_comment?: string;

  @ApiPropertyOptional({
    description: 'Whether the rating is visible publicly',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  is_public?: boolean;
}

/**
 * DTO for seller to respond to a rating.
 */
export class SellerResponseDto {
  @ApiPropertyOptional({
    description: 'Seller response to the rating',
    example: 'Thank you for your feedback!',
  })
  @IsString()
  @IsOptional()
  seller_response?: string;
}
