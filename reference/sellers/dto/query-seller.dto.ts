import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsIn } from 'class-validator';
import { StatusEnum } from '@/utils/enums/status-enum';

/**
 * DTO for querying sellers with filters
 */
export class QuerySellerDto {
  @ApiPropertyOptional({
    type: String,
    example: 'Tech Store',
  })
  @IsOptional()
  @IsString()
  store_name?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'tech-store',
    description: 'Filter by exact seller slug (case-insensitive)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return String(value).trim().toLowerCase();
  })
  @IsString()
  store_slug?: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description:
      'Filter by verification status (accepts: true, false, "true", "false")',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  is_verified?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description:
      'Filter by active status (accepts: true, false, "true", "false")',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Filter by sells_products (true/false)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  sells_products?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Filter by sells_services (true/false)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  sells_services?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Filter by featured status (true/false)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  is_featured?: boolean;

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
    example: 'store_name',
    description:
      'Field to sort by (store_name, store_description, is_verified, sells_products, sells_services, created_at, updated_at, status, user_first_name, user_last_name)',
  })
  @IsOptional()
  @IsString()
  sortField?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'DESC',
    description: 'Sort order (ASC or DESC, default: DESC)',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortBy?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    enum: StatusEnum,
    example: StatusEnum.ACTIVE,
    description: 'Filter by status: Active, Cancelled, or Hold',
  })
  @IsOptional()
  @IsEnum(StatusEnum)
  status?: StatusEnum;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description:
      'Filter by e-district ID — returns only sellers assigned to that district',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseInt(value, 10);
  })
  @IsInt()
  edistrict_id?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'tech-store,dpo-food-trading',
    description:
      'Comma-separated seller slugs to exclude (case-insensitive). e.g. "store-a,store-b"',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const slugs = String(value)
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    return slugs.length > 0 ? slugs : undefined;
  })
  exclude_seller_slug?: string[];
}
