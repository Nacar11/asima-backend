import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ReviewableTypeEnum } from '@/reviews/enums/reviewable-type.enum';
import { ReviewSourceTypeEnum } from '@/reviews/enums/review-source-type.enum';

export class QueryReviewDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  skip?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  take?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  user_id?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  seller_id?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  product_id?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  service_id?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  booking_id?: number;

  @ApiPropertyOptional({
    enum: ReviewableTypeEnum,
    example: ReviewableTypeEnum.PRODUCT,
  })
  @IsOptional()
  @IsEnum(ReviewableTypeEnum)
  reviewable_type?: ReviewableTypeEnum;

  @ApiPropertyOptional({
    enum: ReviewSourceTypeEnum,
    example: ReviewSourceTypeEnum.SALES_ORDER,
  })
  @IsOptional()
  @IsEnum(ReviewSourceTypeEnum)
  source_type?: ReviewSourceTypeEnum;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  is_anonymous?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  is_verified_purchase?: boolean;

  @ApiPropertyOptional({ enum: ['Active', 'Removed'] })
  @IsOptional()
  @IsEnum(['Active', 'Removed'])
  status?: 'Active' | 'Removed';
}
