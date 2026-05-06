import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryCarouselBannersDto {
  @ApiPropertyOptional({
    type: Number,
    example: 0,
    description: 'Number of items to skip (default: 0)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseInt(value, 10);
  })
  @IsInt()
  skip?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 20,
    description: 'Number of items to take/return (default: 20)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseInt(value, 10);
  })
  @IsInt()
  take?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'ASC',
    enum: ['ASC', 'DESC'],
    description: 'Sort by display_order (ASC or DESC, default: ASC)',
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}
