import { IsOptional, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetMediaDto {
  @ApiPropertyOptional({
    description:
      'Search term to filter by filename, title, alt text, or description',
    example: 'product image',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination (starts at 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort field (prefix with - for descending)',
    example: '-created_at',
    default: '-created_at',
  })
  @IsOptional()
  @IsString()
  sort?: string = '-created_at';
}
