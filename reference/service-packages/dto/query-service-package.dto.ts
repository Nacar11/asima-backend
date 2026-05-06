import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServicePackageStatusEnum } from '@/service-packages/enums/service-package-status.enum';

export class QueryServicePackageDto {
  @ApiPropertyOptional({ description: 'Search by name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  service_id?: number;

  @ApiPropertyOptional({ enum: ServicePackageStatusEnum })
  @IsOptional()
  @IsEnum(ServicePackageStatusEnum)
  status?: ServicePackageStatusEnum;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_popular?: boolean;

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
    example: 'name',
    description: 'Field to sort by',
    enum: [
      'name',
      'price',
      'duration_minutes',
      'display_order',
      'created_at',
      'updated_at',
      'status',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'name',
    'price',
    'duration_minutes',
    'display_order',
    'created_at',
    'updated_at',
    'status',
  ])
  sortField?:
    | 'name'
    | 'price'
    | 'duration_minutes'
    | 'display_order'
    | 'created_at'
    | 'updated_at'
    | 'status';

  @ApiPropertyOptional({
    type: String,
    example: 'ASC',
    description: 'Sort direction (ASC or DESC, default: ASC)',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortBy?: 'ASC' | 'DESC';
}
