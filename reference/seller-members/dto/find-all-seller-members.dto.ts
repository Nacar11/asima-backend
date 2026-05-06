import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { SellerMemberStatusEnum } from '@/seller-members/enums/seller-member-status.enum';

export class FindAllSellerMembersDto {
  @ApiPropertyOptional({ type: String, description: 'Search by display name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ type: Number, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;

  @ApiPropertyOptional({ type: Number, description: 'Filter by seller ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  seller_id?: number;

  @ApiPropertyOptional({ type: Number, description: 'Filter by user ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  user_id?: number;

  @ApiPropertyOptional({ enum: SellerMemberStatusEnum })
  @IsOptional()
  @IsEnum(SellerMemberStatusEnum)
  status?: SellerMemberStatusEnum;

  @ApiPropertyOptional({
    type: String,
    example: 'created_at',
    description: 'Field to sort by',
    enum: [
      'display_name',
      'role',
      'seller_id',
      'is_service_provider',
      'max_daily_bookings',
      'created_at',
      'updated_at',
      'status',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'display_name',
    'role',
    'seller_id',
    'is_service_provider',
    'max_daily_bookings',
    'created_at',
    'updated_at',
    'status',
  ])
  sortField?:
    | 'display_name'
    | 'role'
    | 'seller_id'
    | 'is_service_provider'
    | 'max_daily_bookings'
    | 'created_at'
    | 'updated_at'
    | 'status';

  @ApiPropertyOptional({
    type: String,
    example: 'DESC',
    description: 'Sort direction (ASC or DESC, default: DESC)',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortBy?: 'ASC' | 'DESC';
}
