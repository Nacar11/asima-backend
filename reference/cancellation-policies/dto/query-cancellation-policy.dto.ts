import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryCancellationPolicyDto {
  @ApiPropertyOptional({ description: 'Filter by seller ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  seller_id?: number;

  @ApiPropertyOptional({ description: 'Filter by service ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  service_id?: number;

  @ApiPropertyOptional({ description: 'Filter by status (Active/Inactive)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
