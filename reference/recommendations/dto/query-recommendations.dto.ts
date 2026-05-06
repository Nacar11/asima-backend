import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryRecommendationsDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Recommendation type',
    enum: ['similar', 'same_category', 'same_seller'],
    default: 'similar',
  })
  @IsOptional()
  @IsString()
  @IsIn(['similar', 'same_category', 'same_seller'])
  type?: 'similar' | 'same_category' | 'same_seller';

  @ApiPropertyOptional({
    type: Number,
    description: 'Pagination offset',
    default: 0,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return 0;
    return parseInt(value, 10);
  })
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Number of results to return (max 20)',
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return 10;
    return parseInt(value, 10);
  })
  @IsInt()
  @Min(1)
  @Max(20)
  take?: number;
}
