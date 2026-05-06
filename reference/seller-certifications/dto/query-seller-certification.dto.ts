import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QuerySellerCertificationDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'Filter by seller ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  seller_id?: number;

  @ApiPropertyOptional({
    description: 'Search by name or issuer',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    type: String,
    enum: ['Active', 'Expired', 'Revoked'],
    description: 'Filter by status',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  skip?: number;

  @ApiPropertyOptional({
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  take?: number;
}
