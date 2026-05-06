import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';
import { ProductStatusEnum } from '@/utils/enums/product.enum';
import { ListingTypeEnum } from '@/products/enums/listing-type.enum';
import { FeaturedSectionEnum } from '@/products/products.enum';

/**
 * DTO for querying products with filters
 * Individual query parameters for filtering products
 */
export class QueryProductDto {
  @ApiPropertyOptional({ description: 'Search by product name (contains)' })
  @IsOptional()
  @IsString()
  product_name?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ProductStatusEnum,
    example: 'Published',
  })
  @IsOptional()
  @IsString()
  @IsIn(Object.values(ProductStatusEnum))
  status?: ProductStatusEnum;

  @ApiPropertyOptional({ description: 'Filter by seller ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  seller_id?: number;

  @ApiPropertyOptional({
    type: String,
    example: '1,2,3',
    description:
      'Filter by category IDs as a single value (comma-separated like "1,2,3")',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'string') {
      if (value.trim().startsWith('[')) {
        throw new BadRequestException(
          'category_ids must be a comma-separated string (e.g., "1,2,3")',
        );
      }
      return value
        .split(',')
        .map((v) => parseInt(v.trim(), 10))
        .filter((v) => !isNaN(v));
    }
    if (Array.isArray(value)) {
      throw new BadRequestException(
        'category_ids must be a comma-separated string (e.g., "1,2,3")',
      );
    }
    return undefined;
  })
  category_ids?: number[];

  @ApiPropertyOptional({
    type: String,
    example: '1,2,3',
    description:
      'Filter by tag IDs as a single value (comma-separated like "1,2,3")',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'string') {
      if (value.trim().startsWith('[')) {
        throw new BadRequestException(
          'tag_ids must be a comma-separated string (e.g., "1,2,3")',
        );
      }
      return value
        .split(',')
        .map((v) => parseInt(v.trim(), 10))
        .filter((v) => !isNaN(v));
    }
    if (Array.isArray(value)) {
      throw new BadRequestException(
        'tag_ids must be a comma-separated string (e.g., "1,2,3")',
      );
    }
    return undefined;
  })
  tag_ids?: number[];

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  skip?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  take?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'created_at',
    description: 'Field to sort by',
    enum: ['price', 'created_at', 'popularity', 'top_rated'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['price', 'created_at', 'popularity', 'top_rated'])
  sortField?: 'price' | 'created_at' | 'popularity' | 'top_rated';

  @ApiPropertyOptional({
    type: String,
    example: 'DESC',
    description: 'Sort direction (ASC or DESC)',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortBy?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    type: Number,
    example: 100.0,
    description: 'Minimum price filter (products with price >= this value)',
  })
  @IsOptional()
  @Type(() => Number)
  price_range_start?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 500.0,
    description: 'Maximum price filter (products with price <= this value)',
  })
  @IsOptional()
  @Type(() => Number)
  price_range_end?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 4,
    description:
      'Minimum rating filter (1-5). Products with average rating >= this value',
    enum: [1, 2, 3, 4, 5],
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2, 3, 4, 5])
  rating?: number;

  @ApiPropertyOptional({
    description:
      'Filter by featured section. Only returns products present in product_featured_sections with the given section value.',
    enum: FeaturedSectionEnum,
    example: 'featured',
  })
  @IsOptional()
  @IsString()
  @IsIn(Object.values(FeaturedSectionEnum))
  featured_section?: FeaturedSectionEnum;

  @ApiPropertyOptional({
    description: 'Filter by listing type',
    enum: ListingTypeEnum,
    example: 'material',
  })
  @IsOptional()
  @IsString()
  @IsIn(Object.values(ListingTypeEnum))
  listing_type?: ListingTypeEnum;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description:
      'Filter to only include products whose seller is active.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
  })
  active_seller_only?: boolean;
}
